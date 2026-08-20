import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'

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

  const rawBalances = balances.filter((b: any) => b.products?.is_raw_material)
  const finishedBalances = balances.filter((b: any) => b.products?.is_finished_good)

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
          {rawBalances.length === 0 ? (
            <p style={{ fontSize: 13, color: '#999' }}>No stock recorded yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <tbody>
                {rawBalances.map((b: any) => (
                  <tr key={b.product_id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '8px 4px' }}>{b.products?.product_name}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600 }}>
                      {b.current_stock} {b.products?.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Finished Goods Stock</h2>
          {finishedBalances.length === 0 ? (
            <p style={{ fontSize: 13, color: '#999' }}>No stock recorded yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <tbody>
                {finishedBalances.map((b: any) => (
                  <tr key={b.product_id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '8px 4px' }}>{b.products?.product_name}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600 }}>
                      {b.current_stock} {b.products?.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16 }}>Recent Production Batches</h2>
          <Link href="/staff/production/batches" style={{ fontSize: 13, color: '#2563eb' }}>
            View all →
          </Link>
        </div>
        {recentBatches.length === 0 ? (
          <p style={{ fontSize: 13, color: '#999' }}>No batches recorded yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '8px 4px' }}>Batch</th>
                <th style={{ padding: '8px 4px' }}>Product</th>
                <th style={{ padding: '8px 4px' }}>Date</th>
                <th style={{ padding: '8px 4px' }}>Qty Produced</th>
                <th style={{ padding: '8px 4px' }}>Cost / Unit</th>
              </tr>
            </thead>
            <tbody>
              {recentBatches.map((b: any) => (
                <tr key={b.batch_id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '8px 4px', color: '#888' }}>{b.batch_no}</td>
                  <td style={{ padding: '8px 4px' }}>{b.products?.product_name}</td>
                  <td style={{ padding: '8px 4px' }}>{b.production_date}</td>
                  <td style={{ padding: '8px 4px' }}>
                    {b.quantity_produced} {b.products?.unit}
                  </td>
                  <td style={{ padding: '8px 4px' }}>₹{b.cost_per_unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}