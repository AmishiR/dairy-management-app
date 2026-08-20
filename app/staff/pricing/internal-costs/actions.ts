'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function setInternalCost(formData: FormData) {
  const supabase = await createClient()

  const product_id = formData.get('product_id') as string
  const cost_price = Number(formData.get('cost_price'))
  const effective_from = formData.get('effective_from') as string

  // Who made this change — shown in the cost history, same accountability
  // pattern as customer prices.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Close out any currently-open cost for this raw material the day before
  // the new one starts, so the insert below doesn't violate the EXCLUDE
  // constraint that blocks overlapping cost periods.
  const dayBefore = new Date(effective_from)
  dayBefore.setDate(dayBefore.getDate() - 1)
  const dayBeforeStr = dayBefore.toISOString().slice(0, 10)

  const { error: closeError } = await supabase
    .from('internal_costs')
    .update({ effective_to: dayBeforeStr })
    .eq('product_id', product_id)
    .is('effective_to', null)
    .lt('effective_from', effective_from)

  if (closeError) {
    redirect(
      `/staff/pricing/internal-costs/${product_id}?error=${encodeURIComponent(closeError.message)}`
    )
  }

  const { error } = await supabase.from('internal_costs').insert({
    product_id,
    cost_price,
    effective_from,
    created_by: user?.id ?? null,
  })

  if (error) {
    redirect(
      `/staff/pricing/internal-costs/${product_id}?error=${encodeURIComponent(error.message)}`
    )
  }

  revalidatePath(`/staff/pricing/internal-costs/${product_id}`)
  redirect(`/staff/pricing/internal-costs/${product_id}`)
}