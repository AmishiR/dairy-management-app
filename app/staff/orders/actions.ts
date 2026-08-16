'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const orderStatuses = [
  'pending',
  'confirmed',
  'processing',
  'out_for_delivery',
  'partially_delivered',
  'delivered',
  'cancelled',
]

const paymentStatuses = ['unpaid', 'partially_paid', 'paid', 'refunded']

export async function updateOrder(formData: FormData) {
  const supabase = await createClient()

  const order_id = formData.get('order_id') as string
  const status = formData.get('status') as string
  const payment_status = formData.get('payment_status') as string
  const notes = (formData.get('notes') as string | null) || null

  if (!order_id || !orderStatuses.includes(status) || !paymentStatuses.includes(payment_status)) {
    redirect('/staff/orders?error=' + encodeURIComponent('Invalid order update.'))
  }

  const { error } = await supabase
    .from('orders')
    .update({ status, payment_status, notes })
    .eq('order_id', order_id)

  if (error) {
    redirect('/staff/orders?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/staff/orders')
  revalidatePath('/staff')
}