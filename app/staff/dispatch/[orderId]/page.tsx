import Link from 'next/link'
import { createClient } from '@/app/lib/supabase/server'
import DispatchForm from './DispatchForm'

export default async function DispatchOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { orderId } = await params
  const { error } = await searchParams
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      order_id,
      order_no,
      requested_delivery_date,
      status,
      customers(organization_name, customer_code, phone),
      order_items(id, product_id, quantity, quantity_delivered, unit_price, products(product_name, unit, is_raw_material))
    `)
    .eq('order_id', orderId)
    .maybeSingle()

  if (!order) {
    return (
      <div>
        <p style={{ color: 'red' }}>Order not found.</p>
        <Link href="/staff/dispatch">← Dispatch queue</Link>
      </div>
    )
  }

  const openItems = (order.order_items ?? []).filter(
    (it: any) => Number(it.quantity) > Number(it.quantity_delivered)
  )
  const productIds = [...new Set(openItems.map((it: any) => it.product_id))]
  const NONE = '00000000-0000-0000-0000-000000000000'

  // Per-batch remaining = quantity_produced - everything already allocated
  // out of that batch. Derived here rather than from a DB view.
  const { data: rawBatches, error: batchErr } = await supabase
    .from('production_batches')
    .select('batch_id, batch_no, product_id, production_date, quantity_produced')
    .in('product_id', productIds.length ? productIds : [NONE])
    .order('production_date', { ascending: true })
    .order('batch_no', { ascending: true })

  const batchIds = (rawBatches ?? []).map((b: any) => b.batch_id)

  const { data: allocs, error: allocErr } = await supabase
    .from('dispatch_allocations')
    .select('batch_id, quantity')
    .in('batch_id', batchIds.length ? batchIds : [NONE])

  const allocatedByBatch: Record<string, number> = {}
  ;(allocs ?? []).forEach((a: any) => {
    allocatedByBatch[a.batch_id] = (allocatedByBatch[a.batch_id] ?? 0) + Number(a.quantity)
  })

  const batches = (rawBatches ?? [])
    .map((b: any) => ({
      batch_id: b.batch_id,
      batch_no: b.batch_no,
      product_id: b.product_id,
      production_date: b.production_date,
      quantity_remaining: Number(b.quantity_produced) - (allocatedByBatch[b.batch_id] ?? 0),
    }))
    .filter((b) => b.quantity_remaining > 0)

  // Resold raw materials (cow milk, buffalo milk, dahi …) are dispatched
  // straight from inventory_balances — no batch. Everything else is
  // batch-allocated.
  const { data: balances } = await supabase
    .from('inventory_balances')
    .select('product_id, current_stock')
    .in('product_id', productIds.length ? productIds : [NONE])

  const stockByProduct: Record<string, number> = {}
  ;(balances ?? []).forEach((b: any) => {
    stockByProduct[b.product_id] = Number(b.current_stock)
  })

  const lines = openItems.map((it: any) => {
    const direct = it.products?.is_raw_material === true
    return {
      order_item_id: it.id,
      product_name: it.products?.product_name ?? '',
      unit: it.products?.unit ?? '',
      ordered: Number(it.quantity),
      delivered: Number(it.quantity_delivered),
      remaining: Number(it.quantity) - Number(it.quantity_delivered),
      mode: direct ? ('direct' as const) : ('batch' as const),
      stock: stockByProduct[it.product_id] ?? 0,
      batches: direct
        ? []
        : batches
            .filter((b) => b.product_id === it.product_id)
            .map((b) => ({
              batch_id: b.batch_id,
              batch_no: b.batch_no,
              production_date: b.production_date,
              remaining: b.quantity_remaining,
            })),
    }
  })

  const customer = (order as any).customers

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760 }}>
      <div>
        <Link href="/staff/dispatch" style={{ fontSize: 13, color: '#2563eb' }}>
          ← Dispatch queue
        </Link>
        <h1 style={{ fontSize: 22, marginTop: 4 }}>{order.order_no ?? 'Order'}</h1>
        <p style={{ fontSize: 13, color: '#888' }}>
          {customer?.organization_name} · {customer?.customer_code}
          {customer?.phone ? ` · ${customer.phone}` : ''} · requested{' '}
          {order.requested_delivery_date ?? 'not set'}
        </p>
      </div>

      {error && <p style={{ color: 'red', fontSize: 14 }}>{error}</p>}

      {(batchErr || allocErr) && (
        <p style={{ color: 'red', fontSize: 14 }}>
          Could not load batch stock: {(batchErr ?? allocErr)?.message}. If this
          mentions <code>dispatch_allocations</code>, run{' '}
          <code>app/supabse/migrations/dispatch.sql</code> in the Supabase SQL
          Editor (it ends with a schema-cache reload).
        </p>
      )}

      {lines.length === 0 ? (
        <p style={{ fontSize: 13, color: '#999' }}>
          Nothing outstanding on this order — it&apos;s already fully delivered.
        </p>
      ) : (
        <DispatchForm orderId={orderId} lines={lines} />
      )}
    </div>
  )
}
