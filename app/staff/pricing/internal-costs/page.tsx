import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'

// Landing page for Internal Costs: a directory of raw materials/overhead
// items, plus the full cost history across ALL of them in one place.
// Per-item detail pages show only the current cost + change form — full
// history lives here, not repeated on every item's page.
export default async function InternalCostsListPage() {
  const supabase = await createClient()

  const [{ data: rawMaterials, error }, { data: allCosts }] = await Promise.all([
    supabase
      .from('products')
      .select('product_id, product_code, product_name, unit, active')
      .eq('is_raw_material', true)
      .order('product_name'),

    supabase
      .from('internal_costs')
      .select('id, cost_price, effective_from, effective_to, created_at, products(product_name, unit), profiles(full_name)')
      .order('effective_from', { ascending: false })
      .limit(100),
  ])

  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>Internal Costs</h1>
        <p style={{ color: 'red' }}>Error loading raw materials: {error.message}</p>
      </div>
    )
  }

  // "Current cost per product" shown in the list rows — a separate,
  // lightweight query rather than deriving it from the full history above.
  const currentCostByProduct: Record<string, number> = {}
  const { data: activeCosts } = await supabase
    .from('internal_costs')
    .select('product_id, cost_price')
    .is('effective_to', null)

  activeCosts?.forEach((c) => {
    currentCostByProduct[c.product_id] = c.cost_price
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22 }}>Internal Costs</h1>
        <p style={{ fontSize: 13, color: '#888' }}>
          Raw material / overhead costs used for production cost calculations.
          Never shown to customers. Select an item to change its cost.
        </p>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Raw Materials</h2>

        {(!rawMaterials || rawMaterials.length === 0) && (
          <p style={{ fontSize: 13, color: '#999' }}>
            No raw materials yet. Add one from Products first.
          </p>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
              <th style={{ padding: '8px 4px' }}>Code</th>
              <th style={{ padding: '8px 4px' }}>Raw Material</th>
              <th style={{ padding: '8px 4px' }}>Unit</th>
              <th style={{ padding: '8px 4px' }}>Current Cost</th>
              <th style={{ padding: '8px 4px' }}></th>
            </tr>
          </thead>
          <tbody>
            {rawMaterials?.map((p) => (
              <tr key={p.product_id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '8px 4px', color: '#888' }}>{p.product_code}</td>
                <td style={{ padding: '8px 4px' }}>{p.product_name}</td>
                <td style={{ padding: '8px 4px' }}>{p.unit}</td>
                <td style={{ padding: '8px 4px' }}>
                  {currentCostByProduct[p.product_id] !== undefined ? (
                    <>₹{currentCostByProduct[p.product_id]} / {p.unit}</>
                  ) : (
                    <span style={{ color: '#999', fontSize: 13 }}>Not set</span>
                  )}
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <Link
                    href={`/staff/pricing/internal-costs/${p.product_id}`}
                    style={{ fontSize: 13, color: '#2563eb' }}
                  >
                    Manage Cost →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Consolidated history across every raw material — the only place
          this app shows full cost history, per your call to keep it out
          of the per-item pages. */}
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Full Cost History</h2>

        {(!allCosts || allCosts.length === 0) && (
          <p style={{ fontSize: 13, color: '#999' }}>No cost changes recorded yet.</p>
        )}

        {allCosts && allCosts.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '8px 4px' }}>Raw Material</th>
                <th style={{ padding: '8px 4px' }}>Cost</th>
                <th style={{ padding: '8px 4px' }}>From</th>
                <th style={{ padding: '8px 4px' }}>To</th>
                <th style={{ padding: '8px 4px' }}>Set By</th>
                <th style={{ padding: '8px 4px' }}>Set On</th>
              </tr>
            </thead>
            <tbody>
              {allCosts.map((row: any) => (
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