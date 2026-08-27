'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type Allocation = { batch_id: string; quantity: number }
// A line is either batch-allocated (allocations) or direct-from-stock (quantity).
type Line = { order_item_id: string; allocations?: Allocation[]; quantity?: number }

// Confirms a dispatch: the client sends the per-line allocation as a JSON
// blob, this hands it to the confirm_dispatch() Postgres function which
// atomically creates the delivery + delivery_items (+ dispatch_allocations
// for batch-tracked lines) and lets the existing delivery triggers deduct
// stock and advance the order.
export async function confirmDispatch(formData: FormData) {
  const supabase = await createClient()

  const order_id = formData.get('order_id') as string
  const delivery_date = formData.get('delivery_date') as string
  const dm_number = (formData.get('dm_number') as string)?.trim() || null

  let lines: Line[]
  try {
    lines = JSON.parse((formData.get('lines') as string) || '[]')
  } catch {
    redirect(`/staff/dispatch/${order_id}?error=${encodeURIComponent('Could not read the allocation.')}`)
  }

  // Keep only lines that actually dispatch something: a batch-tracked line
  // with real allocations, or a direct-from-stock line with a quantity.
  const payload = lines
    .map((l) => {
      const allocations = (l.allocations ?? []).filter((a) => a.batch_id && a.quantity > 0)
      if (allocations.length > 0) return { order_item_id: l.order_item_id, allocations }
      if ((l.quantity ?? 0) > 0) return { order_item_id: l.order_item_id, quantity: l.quantity }
      return null
    })
    .filter((l): l is NonNullable<typeof l> => l !== null)

  if (!order_id || !delivery_date) {
    redirect(`/staff/dispatch/${order_id}?error=${encodeURIComponent('Pick a delivery date first.')}`)
  }
  if (payload.length === 0) {
    redirect(`/staff/dispatch/${order_id}?error=${encodeURIComponent('Enter a quantity to dispatch for at least one product.')}`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.rpc('confirm_dispatch', {
    p_order_id: order_id,
    p_delivery_date: delivery_date,
    p_lines: payload,
    p_created_by: user?.id ?? null,
    p_dm_number: dm_number,
  })

  if (error) {
    redirect(`/staff/dispatch/${order_id}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/staff/dispatch')
  revalidatePath('/staff/deliveries')
  revalidatePath('/staff/orders')
  revalidatePath('/staff/production')
  revalidatePath('/staff')
  redirect('/staff/deliveries?success=dispatched')
}
