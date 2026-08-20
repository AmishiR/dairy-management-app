import { createClient } from '@/app/lib/supabase/server'
import { recordReceipt } from '../actions'

export default async function NewReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()

  const [rawMaterialsRes, currentCostsRes] = await Promise.all([
    supabase
      .from('products')
      .select('product_id, product_name, unit')
      .eq('is_raw_material', true)
      .eq('active', true)
      .order('product_name'),

    // Current internal cost per raw material — used to prefill the cost
    // field below so staff don't have to remember/retype it every time.
    supabase.from('internal_costs').select('product_id, cost_price').is('effective_to', null),
  ])

  const rawMaterials = rawMaterialsRes.data ?? []
  const productIdsCsv = rawMaterials.map((p) => p.product_id).join(',')

  const currentCostByProduct: Record<string, number> = {}
  currentCostsRes.data?.forEach((c) => {
    currentCostByProduct[c.product_id] = c.cost_price
  })

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Add Raw Material Stock</h1>
      <p style={{ fontSize: 13, color: '#888', marginTop: -12, marginBottom: 16 }}>
        Fill in a quantity for whichever materials actually arrived today —
        leave the rest blank. Cost per unit is prefilled from Internal Costs;
        change it if what you actually paid was different.
      </p>

      {error && (
        <p style={{ color: 'red', fontSize: 14, marginBottom: 12 }}>{error}</p>
      )}

      <form action={recordReceipt} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input type="hidden" name="product_ids" value={productIdsCsv} />

        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ fontSize: 14, flex: 1 }}>
            Receipt Date
            <input
              type="date"
              name="receipt_date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>

          <label style={{ fontSize: 14, flex: 1 }}>
            Supplier
            <input
              type="text"
              name="supplier"
              placeholder="e.g. Local Milk Union"
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '8px 4px' }}>Raw Material</th>
                <th style={{ padding: '8px 4px' }}>Quantity</th>
                <th style={{ padding: '8px 4px' }}>Cost / Unit (₹)</th>
              </tr>
            </thead>
            <tbody>
              {rawMaterials.map((p) => {
                const currentCost = currentCostByProduct[p.product_id]
                return (
                  <tr key={p.product_id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '8px 4px' }}>
                      {p.product_name}{' '}
                      <span style={{ color: '#999', fontSize: 12 }}>({p.unit})</span>
                    </td>
                    <td style={{ padding: '8px 4px' }}>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        name={`qty_${p.product_id}`}
                        style={{ width: 100, padding: 6 }}
                      />
                    </td>
                    <td style={{ padding: '8px 4px' }}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name={`cost_${p.product_id}`}
                        defaultValue={currentCost ?? ''}
                        style={{ width: 100, padding: 6 }}
                      />
                      {currentCost === undefined && (
                        <div style={{ fontSize: 11, color: '#a12622', marginTop: 2 }}>
                          No cost set in Internal Costs
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <button type="submit" style={{ padding: 10, cursor: 'pointer' }}>
          Record Stock
        </button>
      </form>
    </div>
  )
}