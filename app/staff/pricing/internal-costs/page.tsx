import { createClient } from '@/app/lib/supabase/server'
import { setInternalCost } from './actions'

export default async function InternalCostsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()

  const [costsRes, productsRes] = await Promise.all([
    supabase
      .from('internal_costs')
      .select('id, cost_price, effective_from, effective_to, products(product_name, unit)')
      .order('effective_from', { ascending: false })
      .limit(50),
    supabase.from('products').select('product_id, product_name').eq('is_raw_material', true).eq('active', true).order('product_name'),
  ])

  const costs = costsRes.data ?? []
  const products = productsRes.data ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 22 }}>Internal Costs</h1>
      <p style={{ fontSize: 13, color: '#888', marginTop: -16 }}>
        Raw material / overhead costs used for production cost calculations.
        Never shown to customers.
      </p>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, maxWidth: 480 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Set a Cost</h2>

        {error && <p style={{ color: 'red', fontSize: 14, marginBottom: 12 }}>{error}</p>}

        <form action={setInternalCost} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 14 }}>
            Raw Material
            <select name="product_id" required style={{ width: '100%', padding: 8, marginTop: 4 }}>
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: 14 }}>
            Cost Price (₹)
            <input
              type="number"
              step="0.01"
              min="0"
              name="cost_price"
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
            Any existing cost for this raw material closes automatically the
            day before this one starts — past production batches keep the
            cost that was actually used at the time.
          </p>

          <button type="submit" style={{ padding: 10, marginTop: 4, cursor: 'pointer' }}>
            Save Cost
          </button>
        </form>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Cost History</h2>

        {costs.length === 0 ? (
          <p style={{ fontSize: 13, color: '#999' }}>No costs set yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '8px 4px' }}>Raw Material</th>
                <th style={{ padding: '8px 4px' }}>Cost</th>
                <th style={{ padding: '8px 4px' }}>From</th>
                <th style={{ padding: '8px 4px' }}>To</th>
              </tr>
            </thead>
            <tbody>
              {costs.map((row: any) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '8px 4px' }}>{row.products?.product_name}</td>
                  <td style={{ padding: '8px 4px' }}>
                    ₹{row.cost_price} / {row.products?.unit}
                  </td>
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
