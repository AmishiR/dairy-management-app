'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function recordReceipt(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const receipt_date = formData.get('receipt_date') as string
  const supplier = formData.get('supplier') as string
  const productIds = ((formData.get('product_ids') as string) || '')
    .split(',')
    .filter(Boolean)

  // Build the items array from whichever raw material rows the staff
  // member actually filled in — rows left at 0/blank are skipped.
  const items: { product_id: string; quantity: number; cost_per_unit: number }[] = []

  for (const id of productIds) {
    const qty = Number(formData.get(`qty_${id}`))
    const cost = Number(formData.get(`cost_${id}`))
    if (qty > 0) {
      items.push({ product_id: id, quantity: qty, cost_per_unit: cost || 0 })
    }
  }

  if (items.length === 0) {
    redirect(
      `/staff/production/receipts/new?error=${encodeURIComponent(
        'Enter a quantity for at least one raw material.'
      )}`
    )
  }

  // This calls the atomic record_raw_material_receipt() Postgres function —
  // it creates the receipt header, the line items, AND the inventory-in
  // transactions in one go. If anything fails partway, none of it commits.
  const { error } = await supabase.rpc('record_raw_material_receipt', {
    p_receipt_date: receipt_date,
    p_supplier: supplier || null,
    p_items: items,
    p_created_by: user?.id ?? null,
    p_notes: null,
  })

  if (error) {
    redirect(`/staff/production/receipts/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/staff/production')
  redirect('/staff/production?success=receipt')
}