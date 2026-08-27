'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const deliveryStatuses = ['pending', 'partial', 'completed', 'cancelled']

// Deliveries are created only through Dispatch (/staff/dispatch), which
// allocates production-batch stock and calls the confirm_dispatch() RPC.
// This file just handles status edits on an existing delivery.

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