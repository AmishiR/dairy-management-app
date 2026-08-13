import { createClient } from '@/app/lib/supabase/server'
import { toggleProductActive } from './actions'
import Link from 'next/link'

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('product_id, product_code, product_name, category, unit, is_raw_material, is_finished_good, active')
    .order('is_finished_good', { ascending: false })
    .order('product_name', { ascending: true })

  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>Products</h1>
        <p style={{ color: 'red' }}>Error loading products: {error.message}</p>
      </div>
    )
  }

  const finishedGoods = products?.filter((p) => p.is_finished_good) ?? []
  const rawMaterials = products?.filter((p) => p.is_raw_material) ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22 }}>Products</h1>
        <Link
          href="/staff/products/new"
          style={{ padding: '8px 16px', border: '1px solid #333', borderRadius: 6, fontSize: 14 }}
        >
          + Add Product
        </Link>
      </div>

      <ProductTable title="Finished Goods" products={finishedGoods} />
      <ProductTable title="Raw Materials" products={rawMaterials} />
    </div>
  )
}

function ProductTable({
  title,
  products,
}: {
  title: string
  products: {
    product_id: string
    product_code: string
    product_name: string
    category: string
    unit: string
    active: boolean
  }[]
}) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>{title}</h2>

      {products.length === 0 ? (
        <p style={{ fontSize: 13, color: '#999' }}>None yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
              <th style={{ padding: '8px 4px' }}>Code</th>
              <th style={{ padding: '8px 4px' }}>Name</th>
              <th style={{ padding: '8px 4px' }}>Category</th>
              <th style={{ padding: '8px 4px' }}>Unit</th>
              <th style={{ padding: '8px 4px' }}>Status</th>
              <th style={{ padding: '8px 4px' }}></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.product_id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '8px 4px', color: '#888' }}>{p.product_code}</td>
                <td style={{ padding: '8px 4px' }}>{p.product_name}</td>
                <td style={{ padding: '8px 4px' }}>{p.category}</td>
                <td style={{ padding: '8px 4px' }}>{p.unit}</td>
                <td style={{ padding: '8px 4px' }}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: p.active ? '#e6f4ea' : '#fdecea',
                      color: p.active ? '#1e7b34' : '#a12622',
                    }}
                  >
                    {p.active ? 'active' : 'inactive'}
                  </span>
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <form action={toggleProductActive.bind(null, p.product_id, p.active)}>
                    <button
                      type="submit"
                      style={{ fontSize: 12, cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '2px 8px' }}
                    >
                      {p.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
