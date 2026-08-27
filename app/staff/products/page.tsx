import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import ProductsTable from './ProductsTable'

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

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Finished Goods</h2>
        <ProductsTable rows={finishedGoods} />
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Raw Materials</h2>
        <ProductsTable rows={rawMaterials} />
      </div>
    </div>
  )
}
