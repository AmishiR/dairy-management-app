import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'

export default async function BatchesListPage() {
  const supabase = await createClient()

  const { data: batches } = await supabase
    .from('production_batches')
    .select('batch_id, batch_no, production_date, quantity_produced, total_input_cost, cost_per_unit, products(product_name, unit)')
    .order('production_date', { ascending: false })
    .order('batch_no', { ascending: false })
    .limit(50)

  if (!batches || batches.length === 0) {
    return (
      <div>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>Production Batches</h1>
        <p style={{ fontSize: 13, color: '#999' }}>No batches recorded yet.</p>
      </div>
    )
  }

  // Yield calculation: kg of finished good per liter of milk input, across
  // all batches shown — one query for all their inputs, then grouped in JS.
  const batchIds = batches.map((b) => b.batch_id)
  const { data: inputs } = await supabase
    .from('production_inputs')
    .select('batch_id, quantity_used, products(unit)')
    .in('batch_id', batchIds)

  const milkTotalByBatch: Record<string, number> = {}
  inputs?.forEach((row: any) => {
    if (row.products?.unit === 'L') {
      milkTotalByBatch[row.batch_id] = (milkTotalByBatch[row.batch_id] ?? 0) + row.quantity_used
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Link href="/staff/production" style={{ fontSize: 13, color: '#2563eb' }}>
          ← Production
        </Link>
        <h1 style={{ fontSize: 22, marginTop: 4 }}>Production Batches</h1>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
              <th style={{ padding: '8px 4px' }}>Batch</th>
              <th style={{ padding: '8px 4px' }}>Product</th>
              <th style={{ padding: '8px 4px' }}>Date</th>
              <th style={{ padding: '8px 4px' }}>Qty Produced</th>
              <th style={{ padding: '8px 4px' }}>Total Cost</th>
              <th style={{ padding: '8px 4px' }}>Cost / Unit</th>
              <th style={{ padding: '8px 4px' }}>Yield (kg / L milk)</th>
              <th style={{ padding: '8px 4px' }}></th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b: any) => {
              const milkTotal = milkTotalByBatch[b.batch_id]
              const yieldRatio = milkTotal
                ? (b.quantity_produced / milkTotal).toFixed(3)
                : '—'
              return (
                <tr key={b.batch_id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '8px 4px', color: '#888' }}>{b.batch_no}</td>
                  <td style={{ padding: '8px 4px' }}>{b.products?.product_name}</td>
                  <td style={{ padding: '8px 4px' }}>{b.production_date}</td>
                  <td style={{ padding: '8px 4px' }}>
                    {b.quantity_produced} {b.products?.unit}
                  </td>
                  <td style={{ padding: '8px 4px' }}>₹{b.total_input_cost}</td>
                  <td style={{ padding: '8px 4px' }}>₹{b.cost_per_unit}</td>
                  <td style={{ padding: '8px 4px' }}>{yieldRatio}</td>
                  <td style={{ padding: '8px 4px' }}>
                    <Link
                      href={`/staff/production/batches/${b.batch_id}`}
                      style={{ fontSize: 13, color: '#2563eb' }}
                    >
                      Details →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 12, color: '#888' }}>
        Yield = kg of finished good produced per liter of milk input (cow +
        buffalo combined). Higher is better. Dahi/starter inputs are
        excluded from the milk total since they're not milk.
      </p>
    </div>
  )
}