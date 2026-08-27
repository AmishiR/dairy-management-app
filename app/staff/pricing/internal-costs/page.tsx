import { createClient } from '@/app/lib/supabase/server'
import { RawMaterialsTable, CostHistoryTable } from './CostTables'

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

  const rawMaterialRows = (rawMaterials ?? []).map((p) => ({
    product_id: p.product_id,
    product_code: p.product_code,
    product_name: p.product_name,
    unit: p.unit,
    current_cost: currentCostByProduct[p.product_id] ?? null,
  }))

  const historyRows = (allCosts ?? []).map((row: any) => ({
    id: row.id,
    product_name: row.products?.product_name ?? '',
    unit: row.products?.unit ?? '',
    cost_price: row.cost_price,
    effective_from: row.effective_from,
    effective_to: row.effective_to,
    created_at: row.created_at,
    set_by: row.profiles?.full_name ?? 'Unknown staff',
  }))

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
        <RawMaterialsTable rows={rawMaterialRows} />
      </div>

      {/* Consolidated history across every raw material — the only place
          this app shows full cost history, per your call to keep it out
          of the per-item pages. */}
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Full Cost History</h2>
        <CostHistoryTable rows={historyRows} />
      </div>
    </div>
  )
}
