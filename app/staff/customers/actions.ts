'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Pull the editable customer fields out of a submitted form. Optional text
// fields collapse to null so we don't store empty strings.
function readCustomerForm(formData: FormData) {
  return {
    customer_code: (formData.get('customer_code') as string)?.trim(),
    organization_name: (formData.get('organization_name') as string)?.trim(),
    customer_type: ((formData.get('customer_type') as string) || 'retail').trim(),
    contact_person: (formData.get('contact_person') as string)?.trim() || null,
    phone: (formData.get('phone') as string)?.trim() || null,
    email: (formData.get('email') as string)?.trim() || null,
    address: (formData.get('address') as string)?.trim() || null,
    // customer_status enum — only active/inactive are toggled from this UI.
    status:
      (formData.get('status') as string) === 'inactive' ? 'inactive' : 'active',
  }
}

export async function createCustomer(formData: FormData) {
  const supabase = await createClient()
  const values = readCustomerForm(formData)

  if (!values.customer_code || !values.organization_name) {
    redirect(
      `/staff/customers/new?error=${encodeURIComponent(
        'Customer code and organization name are required.'
      )}`
    )
  }
  if (values.email && !EMAIL_REGEX.test(values.email)) {
    redirect(
      `/staff/customers/new?error=${encodeURIComponent(
        'Enter a valid email address or leave it blank.'
      )}`
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('customers')
    .insert({ ...values, created_by: user?.id ?? null })

  if (error) {
    redirect(`/staff/customers/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/staff/customers')
  redirect('/staff/customers')
}

export async function updateCustomer(formData: FormData) {
  const supabase = await createClient()

  const customer_id = formData.get('customer_id') as string
  if (!customer_id) {
    redirect(`/staff/customers?error=${encodeURIComponent('Missing customer id.')}`)
  }

  const dest = `/staff/customers/${customer_id}`
  const values = readCustomerForm(formData)

  if (!values.customer_code || !values.organization_name) {
    redirect(
      `${dest}?error=${encodeURIComponent(
        'Customer code and organization name are required.'
      )}`
    )
  }
  if (values.email && !EMAIL_REGEX.test(values.email)) {
    redirect(
      `${dest}?error=${encodeURIComponent(
        'Enter a valid email address or leave it blank.'
      )}`
    )
  }

  const { error } = await supabase
    .from('customers')
    .update(values)
    .eq('customer_id', customer_id)

  if (error) {
    redirect(`${dest}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/staff/customers')
  revalidatePath(dest)
  redirect(`${dest}?success=1`)
}

export async function toggleCustomerStatus(customerId: string, currentStatus: string) {
  'use server'
  const supabase = await createClient()

  await supabase
    .from('customers')
    .update({ status: currentStatus === 'active' ? 'inactive' : 'active' })
    .eq('customer_id', customerId)

  revalidatePath('/staff/customers')
}
