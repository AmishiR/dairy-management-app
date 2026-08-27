import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import CustomersTable from './CustomersTable'

// Customer directory for staff/admin: add new customers, edit existing
// details, and flip active/inactive status inline.
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error: flash } = await searchParams
  const supabase = await createClient()

  const { data: customers, error } = await supabase
    .from('customers')
    .select(
      'customer_id, customer_code, organization_name, customer_type, contact_person, phone, email, status'
    )
    .order('status', { ascending: true })
    .order('organization_name', { ascending: true })

  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>Customers</h1>
        <p style={{ color: 'red' }}>Error loading customers: {error.message}</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22 }}>Customers</h1>
        <Link
          href="/staff/customers/new"
          style={{ padding: '8px 16px', border: '1px solid #333', borderRadius: 6, fontSize: 14 }}
        >
          + Add Customer
        </Link>
      </div>

      {flash && <p style={{ color: 'red', fontSize: 14 }}>{flash}</p>}

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <CustomersTable rows={customers ?? []} />
      </div>
    </div>
  )
}
