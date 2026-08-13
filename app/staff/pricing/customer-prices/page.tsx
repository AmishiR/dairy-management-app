import { createClient } from '@/app/lib/supabase/server'
import { setCustomerPrice } from './actions'

export default async function CustomerPricesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()

  const [pricesRes, customersRes, productsRes] = await Promise.all([
    supabase
      .from('customer_prices')
      .select('id, selling_price, effective_from, effective_to, customers(organization_name), products(product_name)')
      .order('effective_from', { ascending: false })
      .limit(50),
    supabase.from('customers').select('customer_id, organization_name').eq('status', 'active').order('organization_name'),
    supabase.from('products').select('product_id, product_name').eq('is_finished_good', true).eq('active', true).order('product_name'),
  ])

  const prices = pricesRes.data ?? []
  const customers = customersRes.data ?? []
  const products = productsRes.data ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 22 }}>Customer Prices</h1>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, maxWidth: 480 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Set a Price</h2>

        {error && <p style={{ color: 'red', fontSize: 14, marginBottom: 12 }}>{error}</p>}

        <form action={setCustomerPrice} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 14 }}>
            Customer
            <select name="customer_id" required style={{ width: '100%', padding: 8, marginTop: 4 }}>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.organization_name}
                </option>
              ))}
            </select>
          </label>

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
            If this customer already has a price for this product, it will
            automatically be closed off the day before this new price starts
            — past orders keep their original price.
          </p>

          <button type="submit" style={{ padding: 10, marginTop: 4, cursor: 'pointer' }}>
            Save Price
          </button>
        </form>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Price History</h2>

        {prices.length === 0 ? (
          <p style={{ fontSize: 13, color: '#999' }}>No prices set yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '8px 4px' }}>Customer</th>
                <th style={{ padding: '8px 4px' }}>Product</th>
                <th style={{ padding: '8px 4px' }}>Price</th>
                <th style={{ padding: '8px 4px' }}>From</th>
                <th style={{ padding: '8px 4px' }}>To</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((row: any) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '8px 4px' }}>{row.customers?.organization_name}</td>
                  <td style={{ padding: '8px 4px' }}>{row.products?.product_name}</td>
                  <td style={{ padding: '8px 4px' }}>₹{row.selling_price}</td>
                  <td style={{ padding: '8px 4px' }}>{row.effective_from}</td>
                  <td style={{ padding: '8px 4px' }}>
                    {row.effective_to ?? (
                      <span style={{ color: '#1e7b34', fontSize: 12 }}>current</span>
                    )}
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
