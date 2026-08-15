import { createClient } from '@/app/lib/supabase/server'
import { setCustomerPrice } from '../actions'
import Link from 'next/link'

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

  const currentPrices = allPrices.filter((p) => !p.effective_to)

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
        {currentPrices.length === 0 ? (
          <p style={{ fontSize: 13, color: '#999' }}>No prices set for this customer yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '8px 4px' }}>Product</th>
                <th style={{ padding: '8px 4px' }}>Price</th>
                <th style={{ padding: '8px 4px' }}>Since</th>
                <th style={{ padding: '8px 4px' }}>Set By</th>
              </tr>
            </thead>
            <tbody>
              {currentPrices.map((row: any) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '8px 4px' }}>{row.products?.product_name}</td>
                  <td style={{ padding: '8px 4px' }}>₹{row.selling_price}</td>
                  <td style={{ padding: '8px 4px' }}>{row.effective_from}</td>
                  <td style={{ padding: '8px 4px', color: '#888' }}>
                    {row.profiles?.full_name ?? 'Unknown staff'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
        {allPrices.length === 0 ? (
          <p style={{ fontSize: 13, color: '#999' }}>No history yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '8px 4px' }}>Product</th>
                <th style={{ padding: '8px 4px' }}>Price</th>
                <th style={{ padding: '8px 4px' }}>From</th>
                <th style={{ padding: '8px 4px' }}>To</th>
                <th style={{ padding: '8px 4px' }}>Set By</th>
                <th style={{ padding: '8px 4px' }}>Set On</th>
              </tr>
            </thead>
            <tbody>
              {allPrices.map((row: any) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '8px 4px' }}>{row.products?.product_name}</td>
                  <td style={{ padding: '8px 4px' }}>₹{row.selling_price}</td>
                  <td style={{ padding: '8px 4px' }}>{row.effective_from}</td>
                  <td style={{ padding: '8px 4px' }}>
                    {row.effective_to ?? (
                      <span style={{ color: '#1e7b34', fontSize: 12 }}>current</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 4px', color: '#888' }}>
                    {row.profiles?.full_name ?? 'Unknown staff'}
                  </td>
                  <td style={{ padding: '8px 4px', color: '#888', fontSize: 12 }}>
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}