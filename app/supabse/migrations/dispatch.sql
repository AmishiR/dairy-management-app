-- ============================================================================
-- Dispatch: batch-level allocation for deliveries
-- ============================================================================
-- Safe to run more than once. Paste the whole thing into the Supabase SQL
-- Editor and run it.
--
-- What it adds:
--   * dispatch_allocations  — which production batch fed which delivery line
--   * confirm_dispatch()     — atomic RPC that creates a delivery from an
--                              order plus its per-batch allocation
--
-- Per-batch remaining stock is derived in the app as
--   quantity_produced - SUM(dispatch_allocations.quantity)
-- so there is no view to keep in sync (and nothing that needs PG 15's
-- security_invoker).
--
-- What it deliberately does NOT do: touch inventory_balances,
-- inventory_transactions, order_items.quantity_delivered, or orders.status.
-- Inserting delivery_items already fires fn_apply_delivery_item(), which
-- deducts product-level stock, bumps quantity_delivered, and rolls the order
-- status forward. confirm_dispatch() only layers batch traceability on top.
-- ============================================================================

create table if not exists public.dispatch_allocations (
  id uuid primary key default gen_random_uuid(),
  delivery_item_id uuid not null references public.delivery_items(id) on delete cascade,
  batch_id uuid not null references public.production_batches(batch_id),
  product_id uuid not null references public.products(product_id),
  quantity numeric not null check (quantity > 0),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists dispatch_allocations_batch_idx
  on public.dispatch_allocations (batch_id);
create index if not exists dispatch_allocations_delivery_item_idx
  on public.dispatch_allocations (delivery_item_id);

alter table public.dispatch_allocations enable row level security;

-- Same shape as every other production-side table: staff/admin only.
drop policy if exists dispatch_allocations_staff_only on public.dispatch_allocations;
create policy dispatch_allocations_staff_only on public.dispatch_allocations
  as permissive for all to public
  using (is_staff_or_admin())
  with check (is_staff_or_admin());

grant select, insert, update, delete on public.dispatch_allocations to authenticated;

-- ----------------------------------------------------------------------------
-- confirm_dispatch(): create one delivery for an order, splitting each
-- delivered line across one or more production batches.
--
-- p_lines shape:
--   [
--     { "order_item_id": "<uuid>",
--       "allocations": [ { "batch_id": "<uuid>", "quantity": 15 },
--                        { "batch_id": "<uuid>", "quantity": 5 } ] },
--     ...
--   ]
--
-- The whole thing runs in one transaction: any validation failure (batch
-- over-allocated, wrong product, line exceeds the outstanding order qty,
-- product stock would go negative) raises and rolls everything back.
-- ----------------------------------------------------------------------------
create or replace function public.confirm_dispatch(
  p_order_id uuid,
  p_delivery_date date,
  p_lines jsonb,
  p_created_by uuid default null,
  p_dm_number text default null
)
returns uuid
language plpgsql
as $function$
declare
  v_customer_id uuid;
  v_status order_status;
  v_delivery_id uuid;
  v_line jsonb;
  v_alloc jsonb;
  v_order_item_id uuid;
  v_oi_product_id uuid;
  v_oi_quantity numeric;
  v_oi_delivered numeric;
  v_oi_unit_price numeric;
  v_line_qty numeric;
  v_delivery_item_id uuid;
  v_batch_id uuid;
  v_alloc_qty numeric;
  v_batch_product uuid;
  v_batch_produced numeric;
  v_batch_allocated numeric;
begin
  if p_delivery_date is null then
    raise exception 'delivery_date is required';
  end if;

  select customer_id, status
  into v_customer_id, v_status
  from orders
  where order_id = p_order_id;

  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;
  if v_status = 'cancelled' then
    raise exception 'Order is cancelled — nothing to dispatch';
  end if;

  if p_lines is null or jsonb_array_length(p_lines) = 0 then
    raise exception 'No lines to dispatch';
  end if;

  insert into deliveries (order_id, customer_id, delivery_date, dm_number, status, delivered_by, delivered_at)
  values (p_order_id, v_customer_id, p_delivery_date, p_dm_number, 'completed', p_created_by, now())
  returning delivery_id into v_delivery_id;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_order_item_id := (v_line->>'order_item_id')::uuid;

    select product_id, quantity, quantity_delivered, unit_price
    into v_oi_product_id, v_oi_quantity, v_oi_delivered, v_oi_unit_price
    from order_items
    where id = v_order_item_id and order_id = p_order_id
    for update;

    if not found then
      raise exception 'Order item % does not belong to order %', v_order_item_id, p_order_id;
    end if;

    select coalesce(sum((a->>'quantity')::numeric), 0)
    into v_line_qty
    from jsonb_array_elements(v_line->'allocations') a;

    if v_line_qty <= 0 then
      raise exception 'Line % has no allocated quantity', v_order_item_id;
    end if;
    if v_line_qty > v_oi_quantity - v_oi_delivered then
      raise exception 'Line % dispatch quantity % exceeds the % still outstanding on the order',
        v_order_item_id, v_line_qty, v_oi_quantity - v_oi_delivered;
    end if;

    -- Fires fn_apply_delivery_item(): quantity_delivered, the 'delivered'
    -- inventory_transactions row, and the order status roll-up.
    insert into delivery_items (delivery_id, order_item_id, quantity, unit_price)
    values (v_delivery_id, v_order_item_id, v_line_qty, v_oi_unit_price)
    returning id into v_delivery_item_id;

    for v_alloc in select * from jsonb_array_elements(v_line->'allocations')
    loop
      v_batch_id := (v_alloc->>'batch_id')::uuid;
      v_alloc_qty := (v_alloc->>'quantity')::numeric;

      if v_alloc_qty <= 0 then
        raise exception 'Batch allocation quantity must be greater than 0';
      end if;

      -- Lock the batch row so two concurrent dispatches can't both spend
      -- the same remaining stock.
      select product_id, quantity_produced
      into v_batch_product, v_batch_produced
      from production_batches
      where batch_id = v_batch_id
      for update;

      if not found then
        raise exception 'Batch % not found', v_batch_id;
      end if;
      if v_batch_product <> v_oi_product_id then
        raise exception 'Batch % is a different product than the order line', v_batch_id;
      end if;

      select coalesce(sum(quantity), 0)
      into v_batch_allocated
      from dispatch_allocations
      where batch_id = v_batch_id;

      if v_alloc_qty > v_batch_produced - v_batch_allocated then
        raise exception 'Batch % has only % remaining, cannot allocate %',
          v_batch_id, v_batch_produced - v_batch_allocated, v_alloc_qty;
      end if;

      insert into dispatch_allocations (delivery_item_id, batch_id, product_id, quantity, created_by)
      values (v_delivery_item_id, v_batch_id, v_oi_product_id, v_alloc_qty, p_created_by);
    end loop;
  end loop;

  return v_delivery_id;
end;
$function$;

grant execute on function public.confirm_dispatch(uuid, date, jsonb, uuid, text) to authenticated;

-- Make PostgREST pick up the new table + function right away.
notify pgrst, 'reload schema';
