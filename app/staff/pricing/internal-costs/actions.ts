'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function setInternalCost(formData: FormData) {
  const supabase = await createClient()

  const product_id = formData.get('product_id') as string
  const cost_price = Number(formData.get('cost_price'))
  const effective_from = formData.get('effective_from') as string

  // Same pattern as customer prices — close the currently-open cost the
  // day before, so the new insert doesn't violate the no-overlap constraint.
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
    redirect(`/staff/pricing/internal-costs?error=${encodeURIComponent(closeError.message)}`)
  }

  const { error } = await supabase.from('internal_costs').insert({
    product_id,
    cost_price,
    effective_from,
  })

  if (error) {
    redirect(`/staff/pricing/internal-costs?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/staff/pricing/internal-costs')
  redirect('/staff/pricing/internal-costs')
}