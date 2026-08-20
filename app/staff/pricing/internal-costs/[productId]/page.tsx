import { createClient } from '@/app/lib/supabase/server'
import { setInternalCost } from '../actions'
import Link from 'next/link'

// Per-item page: current cost + the change form only. Full history across
// all raw materials lives on the list page (/staff/pricing/internal-costs),
// not repeated here.
export default async function InternalCostDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { productId } = await params
  const { error } = await searchParams
  const supabase = await createClient()

  const [productRes, currentCostRes] = await Promise.all([
    supabase
      .from('products')
      .select('product_id, product_name, product_code, unit')
      .eq('product_id', productId)
      .single(),

    supabase
      .from('internal_costs')
      .select('cost_price, effective_from, profiles(full_name)')
      .eq('product_id', productId)
      .is('effective_to', null)
      .maybeSingle(),
  ])

  const product = productRes.data
  const currentCost = currentCostRes.data

  if (!product) {
    return (
      <div>
        <p style={{ color: 'red' }}>Raw material not found.</p>
        <Link href="/staff/pricing/internal-costs">← Back to raw materials</Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Link href="/staff/pricing/internal-costs" style={{ fontSize: 13, color: '#2563eb' }}>
          ← All raw materials
        </Link>
        <h1 style={{ fontSize: 22, marginTop: 4 }}>{product.product_name}</h1>
        <p style={{ fontSize: 13, color: '#888' }}>
          {product.product_code} · {product.unit}
        </p>
      </div>

      {/* Current cost at a glance */}
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Current Cost</h2>
        {!currentCost ? (
          <p style={{ fontSize: 13, color: '#999' }}>No cost set for this item yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 4px', color: '#888' }}>Cost</td>
                <td style={{ padding: '8px 4px' }}>
                  ₹{currentCost.cost_price} / {product.unit}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 4px', color: '#888' }}>Since</td>
                <td style={{ padding: '8px 4px' }}>{currentCost.effective_from}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 4px', color: '#888' }}>Set By</td>
                <td style={{ padding: '8px 4px' }}>
                  {(currentCost as any).profiles?.full_name ?? 'Unknown staff'}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Set / change a cost */}
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, maxWidth: 480 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Set / Change Cost</h2>

        {error && <p style={{ color: 'red', fontSize: 14, marginBottom: 12 }}>{error}</p>}

        <form action={setInternalCost} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="hidden" name="product_id" value={product.product_id} />

          <label style={{ fontSize: 14 }}>
            Cost Price (₹ per {product.unit})
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
            The current cost closes automatically the day before this new one
            starts — past production batches keep the cost that was actually
            used at the time.
          </p>

          <button type="submit" style={{ padding: 10, marginTop: 4, cursor: 'pointer' }}>
            Save Cost
          </button>
        </form>
      </div>

      <p style={{ fontSize: 13, color: '#888' }}>
        Want to see every past change for all raw materials? Full history is
        on the{' '}
        <Link href="/staff/pricing/internal-costs" style={{ color: '#2563eb' }}>
          Internal Costs list page
        </Link>
        .
      </p>
    </div>
  )
}