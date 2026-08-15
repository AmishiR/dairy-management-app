import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'

// Landing page for Customer Prices: a directory of customers. Click into
// one to see/manage their specific product prices and history.
export default async function CustomerPricingListPage() {
  const supabase = await createClient()

  const [{ data: customers, error }, { data: activePrices }] = await Promise.all([
    supabase
      .from('customers')
      .select('customer_id, customer_code, organization_name, customer_type, status')
      .order('organization_name'),
    supabase.from('customer_prices').select('customer_id').is('effective_to', null),
  ])

  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>Customer Prices</h1>
        <p style={{ color: 'red' }}>Error loading customers: {error.message}</p>
      </div>
    )
  }

  // Count how many products currently have an active price per customer,
  // so staff can see at a glance who still needs pricing set up.
  const priceCounts: Record<string, number> = {}
  activePrices?.forEach((p) => {
    priceCounts[p.customer_id] = (priceCounts[p.customer_id] ?? 0) + 1
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22 }}>Customer Prices</h1>
        <p style={{ fontSize: 13, color: '#888' }}>
          Select a customer to view and manage their product prices.
        </p>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        {(!customers || customers.length === 0) && (
          <p style={{ fontSize: 13, color: '#999' }}>
            No customers yet. Add one from Customer Management first.
          </p>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
              <th style={{ padding: '8px 4px' }}>Code</th>
              <th style={{ padding: '8px 4px' }}>Customer</th>
              <th style={{ padding: '8px 4px' }}>Type</th>
              <th style={{ padding: '8px 4px' }}>Status</th>
              <th style={{ padding: '8px 4px' }}>Products Priced</th>
              <th style={{ padding: '8px 4px' }}></th>
            </tr>
          </thead>
          <tbody>
            {customers?.map((c) => (
              <tr key={c.customer_id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '8px 4px', color: '#888' }}>{c.customer_code}</td>
                <td style={{ padding: '8px 4px' }}>{c.organization_name}</td>
                <td style={{ padding: '8px 4px' }}>{c.customer_type}</td>
                <td style={{ padding: '8px 4px' }}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: c.status === 'active' ? '#e6f4ea' : '#fdecea',
                      color: c.status === 'active' ? '#1e7b34' : '#a12622',
                    }}
                  >
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '8px 4px' }}>{priceCounts[c.customer_id] ?? 0}</td>
                <td style={{ padding: '8px 4px' }}>
                  <Link
                    href={`/staff/pricing/customer-prices/${c.customer_id}`}
                    style={{ fontSize: 13, color: '#2563eb' }}
                  >
                    Manage Prices →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}