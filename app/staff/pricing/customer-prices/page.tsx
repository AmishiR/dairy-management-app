import { createClient } from '@/app/lib/supabase/server'
import CustomerDirectoryTable from './CustomerDirectoryTable'

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

  const rows = (customers ?? []).map((c) => ({
    ...c,
    products_priced: priceCounts[c.customer_id] ?? 0,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22 }}>Customer Prices</h1>
        <p style={{ fontSize: 13, color: '#888' }}>
          Select a customer to view and manage their product prices.
        </p>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <CustomerDirectoryTable rows={rows} />
      </div>
    </div>
  )
}
