'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const deliveryStatuses = ['pending', 'partial', 'completed', 'cancelled']

export async function createDelivery(formData: FormData) {
  const supabase = await createClient()

  const order_id = formData.get('order_id') as string
  const delivery_date = formData.get('delivery_date') as string
  const dm_number = (formData.get('dm_number') as string | null) || null

  if (!order_id || !delivery_date) {
    redirect('/staff/deliveries?error=' + encodeURIComponent('Order and delivery date are required.'))
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      customer_id,
      order_items(
        id,
        quantity,
        quantity_delivered,
        unit_price
      )
    `)
    .eq('order_id', order_id)
    .single()

  if (orderError || !order) {
    redirect('/staff/deliveries?error=' + encodeURIComponent(orderError?.message ?? 'Order not found.'))
  }

  const deliveryItems = order.order_items
    ?.map((item: any) => {
      const quantity = Number(formData.get(`quantity_${item.id}`) || 0)
      const remaining = Number(item.quantity) - Number(item.quantity_delivered)

      return {
        order_item_id: item.id,
        quantity,
        unit_price: item.unit_price,
        remaining,
      }
    })
    .filter((item: any) => item.quantity > 0)

  if (!deliveryItems?.length) {
    redirect('/staff/deliveries?error=' + encodeURIComponent('Enter at least one delivery quantity.'))
  }

  const invalidItem = deliveryItems.find((item: any) => item.quantity > item.remaining)

  if (invalidItem) {
    redirect('/staff/deliveries?error=' + encodeURIComponent('Delivery quantity cannot be more than remaining order quantity.'))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: delivery, error: deliveryError } = await supabase
    .from('deliveries')
    .insert({
      order_id,
      customer_id: order.customer_id,
      delivery_date,
      dm_number,
      status: 'completed',
      delivered_by: user?.id ?? null,
      delivered_at: new Date().toISOString(),
    })
    .select('delivery_id')
    .single()

  if (deliveryError || !delivery) {
    redirect('/staff/deliveries?error=' + encodeURIComponent(deliveryError?.message ?? 'Could not create delivery.'))
  }

  const { error: itemsError } = await supabase.from('delivery_items').insert(
    deliveryItems.map((item: any) => ({
      delivery_id: delivery.delivery_id,
      order_item_id: item.order_item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))
  )

  if (itemsError) {
    redirect('/staff/deliveries?error=' + encodeURIComponent(itemsError.message))
  }

  revalidatePath('/staff/deliveries')
  revalidatePath('/staff/orders')
  revalidatePath('/staff')
  redirect('/staff/deliveries')
}

export async function updateDelivery(formData: FormData) {
  const supabase = await createClient()

  const delivery_id = formData.get('delivery_id') as string
  const status = formData.get('status') as string
  const delivered_at = status === 'completed' ? new Date().toISOString() : null

  if (!delivery_id || !deliveryStatuses.includes(status)) {
    redirect('/staff/deliveries?error=' + encodeURIComponent('Invalid delivery update.'))
  }

  const { error } = await supabase
    .from('deliveries')
    .update({ status, delivered_at })
    .eq('delivery_id', delivery_id)

  if (error) {
    redirect('/staff/deliveries?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/staff/deliveries')
  revalidatePath('/staff')
}