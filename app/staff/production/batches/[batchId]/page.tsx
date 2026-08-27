import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import InputsTable from './InputsTable'

export default async function BatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ batchId: string }>
  searchParams: Promise<{ success?: string }>
}) {
  const { batchId } = await params
  const { success } = await searchParams
  const supabase = await createClient()

  const [batchRes, inputsRes] = await Promise.all([
    supabase
      .from('production_batches')
      .select('batch_id, batch_no, production_date, quantity_produced, total_input_cost, cost_per_unit, products(product_name, unit), profiles(full_name)')
      .eq('batch_id', batchId)
      .single(),

    supabase
      .from('production_inputs')
      .select('id, quantity_used, cost_per_unit, total_cost, products(product_name, unit)')
      .eq('batch_id', batchId),
  ])

  const batch = batchRes.data
  const inputs = inputsRes.data ?? []

  if (!batch) {
    return (
      <div>
        <p style={{ color: 'red' }}>Batch not found.</p>
        <Link href="/staff/production/batches">← Back to batches</Link>
      </div>
    )
  }

  const inputRows = inputs.map((i: any) => ({
    id: i.id,
    product_name: i.products?.product_name ?? '',
    unit: i.products?.unit ?? '',
    quantity_used: i.quantity_used,
    cost_per_unit: i.cost_per_unit,
    total_cost: i.total_cost,
  }))

  const milkTotal = inputs
    .filter((i: any) => i.products?.unit === 'L')
    .reduce((sum: number, i: any) => sum + i.quantity_used, 0)

  const yieldRatio = milkTotal > 0 ? (batch.quantity_produced / milkTotal).toFixed(3) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Link href="/staff/production/batches" style={{ fontSize: 13, color: '#2563eb' }}>
          ← All batches
        </Link>
        <h1 style={{ fontSize: 22, marginTop: 4 }}>{batch.batch_no}</h1>
      </div>

      {success && (
        <p style={{ color: '#1e7b34', fontSize: 14 }}>Batch recorded successfully.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <SummaryCard
          label="Produced"
          value={`${batch.quantity_produced} ${(batch as any).products?.unit}`}
        />
        <SummaryCard label="Total Input Cost" value={`₹${batch.total_input_cost}`} />
        <SummaryCard label="Cost / Unit" value={`₹${batch.cost_per_unit}`} />
      </div>

      {yieldRatio && (
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 16, marginBottom: 4 }}>Yield</h2>
          <p style={{ fontSize: 24, fontWeight: 600 }}>{yieldRatio} kg / L milk</p>
          <p style={{ fontSize: 12, color: '#888' }}>
            {batch.quantity_produced} {(batch as any).products?.unit} produced from{' '}
            {milkTotal} L of milk (cow + buffalo combined).
          </p>
        </div>
      )}

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Inputs Used</h2>
        <InputsTable rows={inputRows} />
      </div>

      <p style={{ fontSize: 12, color: '#888' }}>
        Recorded by {(batch as any).profiles?.full_name ?? 'unknown staff'} on{' '}
        {batch.production_date}. Costs shown are the exact snapshot used at
        production time — they won&apos;t change even if internal costs
        change later.
      </p>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 13, color: '#888' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600 }}>{value}</div>
    </div>
  )
}