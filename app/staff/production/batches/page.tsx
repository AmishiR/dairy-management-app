import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import BatchesTable from './BatchesTable'

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

  const rows = batches.map((b: any) => {
    const milkTotal = milkTotalByBatch[b.batch_id]
    return {
      batch_id: b.batch_id,
      batch_no: b.batch_no,
      product_name: b.products?.product_name ?? '',
      production_date: b.production_date,
      quantity_produced: b.quantity_produced,
      unit: b.products?.unit ?? '',
      total_input_cost: b.total_input_cost,
      cost_per_unit: b.cost_per_unit,
      yield_ratio: milkTotal ? b.quantity_produced / milkTotal : null,
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
        <BatchesTable rows={rows} />
      </div>

      <p style={{ fontSize: 12, color: '#888' }}>
        Yield = kg of finished good produced per liter of milk input (cow +
        buffalo combined). Higher is better. Dahi/starter inputs are
        excluded from the milk total since they&apos;re not milk.
      </p>
    </div>
  )
}
