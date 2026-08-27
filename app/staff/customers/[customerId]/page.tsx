import Link from 'next/link'
import { createClient } from '@/app/lib/supabase/server'
import { updateCustomer } from '../actions'
import CustomerForm from '../CustomerForm'

export default async function EditCustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ customerId: string }>
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { customerId } = await params
  const { error, success } = await searchParams
  const supabase = await createClient()

  const { data: customer } = await supabase
    .from('customers')
    .select(
      'customer_id, customer_code, organization_name, customer_type, contact_person, phone, email, address, status, created_at'
    )
    .eq('customer_id', customerId)
    .maybeSingle()

  if (!customer) {
    return (
      <div>
        <p style={{ color: 'red' }}>Customer not found.</p>
        <Link href="/staff/customers">← Back to customers</Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <div>
        <Link href="/staff/customers" style={{ fontSize: 13, color: '#2563eb' }}>
          ← All customers
        </Link>
        <h1 style={{ fontSize: 22, marginTop: 4 }}>{customer.organization_name}</h1>
        <p style={{ fontSize: 13, color: '#888' }}>
          {customer.customer_code} · added {String(customer.created_at).slice(0, 10)}
        </p>
      </div>

      {success && <p style={{ color: '#1e7b34', fontSize: 14 }}>Saved.</p>}
      {error && <p style={{ color: 'red', fontSize: 14 }}>{error}</p>}

      <CustomerForm action={updateCustomer} customer={customer} submitLabel="Save Changes" />
    </div>
  )
}
