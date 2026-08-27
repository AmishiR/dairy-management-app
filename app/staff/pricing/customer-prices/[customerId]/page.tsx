import { createClient } from '@/app/lib/supabase/server'
import { setCustomerPrice } from '../actions'
import Link from 'next/link'
import { CurrentPricesTable, PriceHistoryTable } from './PriceTables'

export default async function CustomerPricingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ customerId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { customerId } = await params
  const { error } = await searchParams
  const supabase = await createClient()

  const [customerRes, pricesRes, productsRes] = await Promise.all([
    supabase
      .from('customers')
      .select('customer_id, organization_name, customer_code')
      .eq('customer_id', customerId)
      .single(),

    // created_by joins to profiles so we can show which staff member set
    // each price — this is the accountability trail you asked for.
    supabase
      .from('customer_prices')
      .select(
        'id, selling_price, effective_from, effective_to, created_at, products(product_name), created_by, profiles(full_name)'
      )
      .eq('customer_id', customerId)
      .order('effective_from', { ascending: false }),

    supabase
      .from('products')
      .select('product_id, product_name')
      .eq('is_finished_good', true)
      .eq('active', true)
      .order('product_name'),
  ])

  const customer = customerRes.data
  const allPrices = pricesRes.data ?? []
  const products = productsRes.data ?? []

  if (!customer) {
    return (
      <div>
        <p style={{ color: 'red' }}>Customer not found.</p>
        <Link href="/staff/pricing/customer-prices">← Back to customers</Link>
      </div>
    )
  }

  const historyRows = allPrices.map((row: any) => ({
    id: row.id,
    product_name: row.products?.product_name ?? '',
    selling_price: row.selling_price,
    effective_from: row.effective_from,
    effective_to: row.effective_to,
    created_at: row.created_at,
    set_by: row.profiles?.full_name ?? 'Unknown staff',
  }))
  const currentPriceRows = historyRows.filter((p) => !p.effective_to)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Link href="/staff/pricing/customer-prices" style={{ fontSize: 13, color: '#2563eb' }}>
          ← All customers
        </Link>
        <h1 style={{ fontSize: 22, marginTop: 4 }}>{customer.organization_name}</h1>
        <p style={{ fontSize: 13, color: '#888' }}>{customer.customer_code}</p>
      </div>

      {/* Current prices at a glance */}
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Current Prices</h2>
        <CurrentPricesTable rows={currentPriceRows} />
      </div>

      {/* Set / change a price */}
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, maxWidth: 480 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Set / Change a Price</h2>

        {error && <p style={{ color: 'red', fontSize: 14, marginBottom: 12 }}>{error}</p>}

        <form action={setCustomerPrice} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="hidden" name="customer_id" value={customer.customer_id} />

          <label style={{ fontSize: 14 }}>
            Product
            <select name="product_id" required style={{ width: '100%', padding: 8, marginTop: 4 }}>
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: 14 }}>
            Selling Price (₹)
            <input
              type="number"
              step="0.01"
              min="0"
              name="selling_price"
              required
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>

          <label style={{ fontSize: 14 }}>
            Effective From
            <input
              type="date"
              name="effective_from"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>

          <p style={{ fontSize: 12, color: '#888' }}>
            If this product already has a current price, it closes automatically
            the day before this new one starts — past orders keep their original price.
          </p>

          <button type="submit" style={{ padding: 10, marginTop: 4, cursor: 'pointer' }}>
            Save Price
          </button>
        </form>
      </div>

      {/* Full history, this customer only */}
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Full Price History</h2>
        <PriceHistoryTable rows={historyRows} />
      </div>
    </div>
  )
}