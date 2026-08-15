'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function setCustomerPrice(formData: FormData) {
  const supabase = await createClient()

  const customer_id = formData.get('customer_id') as string
  const product_id = formData.get('product_id') as string
  const selling_price = Number(formData.get('selling_price'))
  const effective_from = formData.get('effective_from') as string

  // Who is making this change — this is what gets shown in the price
  // history so staff can see who set/changed each price.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Close out any currently-open price for this customer/product the day
  // before the new one starts, so the insert below doesn't violate the
  // EXCLUDE constraint that blocks overlapping price periods.
  const dayBefore = new Date(effective_from)
  dayBefore.setDate(dayBefore.getDate() - 1)
  const dayBeforeStr = dayBefore.toISOString().slice(0, 10)

  const { error: closeError } = await supabase
    .from('customer_prices')
    .update({ effective_to: dayBeforeStr })
    .eq('customer_id', customer_id)
    .eq('product_id', product_id)
    .is('effective_to', null)
    .lt('effective_from', effective_from)

  if (closeError) {
    redirect(
      `/staff/pricing/customer-prices/${customer_id}?error=${encodeURIComponent(closeError.message)}`
    )
  }

  const { error } = await supabase.from('customer_prices').insert({
    customer_id,
    product_id,
    selling_price,
    effective_from,
    created_by: user?.id ?? null,
  })

  if (error) {
    redirect(
      `/staff/pricing/customer-prices/${customer_id}?error=${encodeURIComponent(error.message)}`
    )
  }

  revalidatePath(`/staff/pricing/customer-prices/${customer_id}`)
  redirect(`/staff/pricing/customer-prices/${customer_id}`)
}