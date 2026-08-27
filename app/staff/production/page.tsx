import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { StockTable, RecentBatchesTable } from './ProductionTables'

export default async function ProductionOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const { success } = await searchParams
  const supabase = await createClient()

  const [balancesRes, recentBatchesRes] = await Promise.all([
    supabase
      .from('inventory_balances')
      .select('product_id, current_stock, updated_at, products(product_name, unit, is_raw_material, is_finished_good)')
      .order('updated_at', { ascending: false }),

    supabase
      .from('production_batches')
      .select('batch_id, batch_no, production_date, quantity_produced, cost_per_unit, products(product_name, unit)')
      .order('production_date', { ascending: false })
      .order('batch_no', { ascending: false })
      .limit(5),
  ])

  const balances = balancesRes.data ?? []
  const recentBatches = recentBatchesRes.data ?? []

  const toStockRow = (b: any) => ({
    product_id: b.product_id,
    product_name: b.products?.product_name ?? '',
    unit: b.products?.unit ?? '',
    current_stock: b.current_stock,
  })

  const rawBalances = balances.filter((b: any) => b.products?.is_raw_material).map(toStockRow)
  const finishedBalances = balances.filter((b: any) => b.products?.is_finished_good).map(toStockRow)

  const recentBatchRows = recentBatches.map((b: any) => ({
    batch_id: b.batch_id,
    batch_no: b.batch_no,
    product_name: b.products?.product_name ?? '',
    production_date: b.production_date,
    quantity_produced: b.quantity_produced,
    unit: b.products?.unit ?? '',
    cost_per_unit: b.cost_per_unit,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22 }}>Production</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href="/staff/production/receipts/new"
            style={{ padding: '8px 16px', border: '1px solid #333', borderRadius: 6, fontSize: 14 }}
          >
            + Add Raw Material Stock
          </Link>
          <Link
            href="/staff/production/batches/new"
            style={{ padding: '8px 16px', border: '1px solid #333', borderRadius: 6, fontSize: 14, background: '#111', color: '#fff' }}
          >
            + Record Production Batch
          </Link>
        </div>
      </div>

      {success === 'receipt' && (
        <p style={{ color: '#1e7b34', fontSize: 14 }}>Raw material stock recorded.</p>
      )}
      {success === 'batch' && (
        <p style={{ color: '#1e7b34', fontSize: 14 }}>Production batch recorded.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Raw Material Stock</h2>
          <StockTable rows={rawBalances} />
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Finished Goods Stock</h2>
          <StockTable rows={finishedBalances} />
        </div>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16 }}>Recent Production Batches</h2>
          <Link href="/staff/production/batches" style={{ fontSize: 13, color: '#2563eb' }}>
            View all →
          </Link>
        </div>
        <RecentBatchesTable rows={recentBatchRows} />
      </div>
    </div>
  )
}
