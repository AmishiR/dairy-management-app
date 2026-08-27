import Link from 'next/link'
import { createCustomer } from '../actions'
import CustomerForm from '../CustomerForm'

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <div>
        <Link href="/staff/customers" style={{ fontSize: 13, color: '#2563eb' }}>
          ← All customers
        </Link>
        <h1 style={{ fontSize: 22, marginTop: 4 }}>Add Customer</h1>
      </div>

      {error && <p style={{ color: 'red', fontSize: 14 }}>{error}</p>}

      <CustomerForm action={createCustomer} submitLabel="Create Customer" />
    </div>
  )
}
