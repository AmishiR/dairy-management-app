import { createProduct } from '../actions'

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Add Product</h1>

      {error && (
        <p style={{ color: 'red', fontSize: 14, marginBottom: 12 }}>{error}</p>
      )}

      <form
        action={createProduct}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <label style={{ fontSize: 14 }}>
          Product Code
          <input
            name="product_code"
            required
            placeholder="e.g. FG-GHEE"
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label style={{ fontSize: 14 }}>
          Product Name
          <input
            name="product_name"
            required
            placeholder="e.g. Ghee"
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label style={{ fontSize: 14 }}>
          Category
          <input
            name="category"
            required
            placeholder="e.g. finished_good or raw_material"
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label style={{ fontSize: 14 }}>
          Unit
          <select name="unit" required style={{ width: '100%', padding: 8, marginTop: 4 }}>
            <option value="L">L (liters)</option>
            <option value="kg">kg</option>
            <option value="pcs">pcs</option>
            <option value="lot">lot</option>
          </select>
        </label>

        <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
          <label>
            <input type="checkbox" name="is_raw_material" /> Raw material
          </label>
          <label>
            <input type="checkbox" name="is_finished_good" /> Finished good
          </label>
        </div>

        <button type="submit" style={{ padding: 10, marginTop: 8, cursor: 'pointer' }}>
          Create Product
        </button>
      </form>
    </div>
  )
}
