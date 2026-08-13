'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProduct(formData: FormData) {
  const supabase = await createClient()

  const product_code = formData.get('product_code') as string
  const product_name = formData.get('product_name') as string
  const category = formData.get('category') as string
  const unit = formData.get('unit') as string
  const is_raw_material = formData.get('is_raw_material') === 'on'
  const is_finished_good = formData.get('is_finished_good') === 'on'

  if (!is_raw_material && !is_finished_good) {
    redirect(
      `/staff/products/new?error=${encodeURIComponent(
        'A product must be marked as raw material, finished good, or both.'
      )}`
    )
  }

  const { error } = await supabase.from('products').insert({
    product_code,
    product_name,
    category,
    unit,
    is_raw_material,
    is_finished_good,
  })

  if (error) {
    redirect(`/staff/products/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/staff/products')
  redirect('/staff/products')
}

export async function toggleProductActive(productId: string, currentlyActive: boolean) {
  'use server'
  const supabase = await createClient()

  await supabase
    .from('products')
    .update({ active: !currentlyActive })
    .eq('product_id', productId)

  revalidatePath('/staff/products')
}