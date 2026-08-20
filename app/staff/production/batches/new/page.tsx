import { createClient } from '@/app/lib/supabase/server'
import { createBatch } from '../actions'

export default async function NewBatchPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()

  const [finishedGoodsRes, rawMaterialsRes] = await Promise.all([
    supabase
      .from('products')
      .select('product_id, product_name, unit')
      .eq('is_finished_good', true)
      .eq('active', true)
      .order('product_name'),
    supabase
      .from('products')
      .select('product_id, product_name, unit')
      .eq('is_raw_material', true)
      .eq('active', true)
      .order('product_name'),
  ])

  const finishedGoods = finishedGoodsRes.data ?? []
  const rawMaterials = rawMaterialsRes.data ?? []
  const rawProductIdsCsv = rawMaterials.map((p) => p.product_id).join(',')

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Record Production Batch</h1>
      <p style={{ fontSize: 13, color: '#888', marginTop: -12, marginBottom: 16 }}>
        A batch number is generated automatically. Cost per raw material is
        looked up automatically from the internal cost that was active on
        the production date — you don&apos;t need to enter it here.
      </p>

      {error && (
        <p style={{ color: 'red', fontSize: 14, marginBottom: 12 }}>{error}</p>
      )}

      <form action={createBatch} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input type="hidden" name="raw_product_ids" value={rawProductIdsCsv} />

        <label style={{ fontSize: 14 }}>
          Product Being Produced
          <select name="product_id" required style={{ width: '100%', padding: 8, marginTop: 4 }}>
            {finishedGoods.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_name}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ fontSize: 14, flex: 1 }}>
            Production Date
            <input
              type="date"
              name="production_date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>

          <label style={{ fontSize: 14, flex: 1 }}>
            Quantity Produced
            <input
              type="number"
              step="0.001"
              min="0.001"
              name="quantity_produced"
              required
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 14, marginBottom: 8 }}>Raw Materials Used</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '8px 4px' }}>Raw Material</th>
                <th style={{ padding: '8px 4px' }}>Quantity Used</th>
              </tr>
            </thead>
            <tbody>
              {rawMaterials.map((p) => (
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
                      name={`used_${p.product_id}`}
                      style={{ width: 120, padding: 6 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: 12, color: '#888' }}>
          If a raw material doesn&apos;t have enough stock, or has no internal
          cost defined for this date, the whole batch will be rejected —
          nothing partially saves.
        </p>

        <button type="submit" style={{ padding: 10, cursor: 'pointer' }}>
          Record Batch
        </button>
      </form>
    </div>
  )
}