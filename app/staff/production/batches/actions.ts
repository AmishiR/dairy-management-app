'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createBatch(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const product_id = formData.get('product_id') as string
  const production_date = formData.get('production_date') as string
  const quantity_produced = Number(formData.get('quantity_produced'))
  const rawProductIds = ((formData.get('raw_product_ids') as string) || '')
    .split(',')
    .filter(Boolean)

  if (!product_id || quantity_produced <= 0) {
    redirect(
      `/staff/production/batches/new?error=${encodeURIComponent(
        'Select a product and enter a quantity produced greater than 0.'
      )}`
    )
  }

  const inputs: { raw_product_id: string; quantity_used: number }[] = []

  for (const id of rawProductIds) {
    const qty = Number(formData.get(`used_${id}`))
    if (qty > 0) {
      inputs.push({ raw_product_id: id, quantity_used: qty })
    }
  }

  if (inputs.length === 0) {
    redirect(
      `/staff/production/batches/new?error=${encodeURIComponent(
        'Enter a quantity used for at least one raw material.'
      )}`
    )
  }

  // This calls the atomic create_production_batch() Postgres function:
  // it generates the batch number, looks up each raw material's cost as of
  // production_date, deducts raw stock, computes total cost, and adds the
  // finished goods to stock — all in one transaction. If stock is
  // insufficient or a cost isn't defined for that date, the WHOLE batch
  // rolls back; nothing partially succeeds.
  const { data: batchId, error } = await supabase.rpc('create_production_batch', {
    p_product_id: product_id,
    p_production_date: production_date,
    p_quantity_produced: quantity_produced,
    p_inputs: inputs,
    p_created_by: user?.id ?? null,
  })

  if (error) {
    redirect(`/staff/production/batches/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/staff/production')
  revalidatePath('/staff/production/batches')
  redirect(`/staff/production/batches/${batchId}?success=1`)
}