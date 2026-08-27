import { createClient } from '@/app/lib/supabase/server'
import DispatchQueueTable from './DispatchQueueTable'

// Dispatch queue: every order that still has undelivered quantity. Picking
// one opens the per-batch allocation screen.
export default async function DispatchPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()

  const { data: orders, error: loadError } = await supabase
    .from('orders')
    .select(`
      order_id,
      order_no,
      requested_delivery_date,
      status,
      customers(organization_name, customer_code),
      order_items(id, quantity, quantity_delivered, products(product_name, unit))
    `)
    .not('status', 'in', '("delivered","cancelled")')
    .order('requested_delivery_date', { ascending: true })

  if (loadError) {
    return (
      <div>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>Dispatch</h1>
        <p style={{ color: 'red' }}>Error loading orders: {loadError.message}</p>
      </div>
    )
  }

  const rows = (orders ?? [])
    .map((o: any) => ({
      order_id: o.order_id,
      order_no: o.order_no ?? '—',
      customer: o.customers?.organization_name ?? '',
      customer_code: o.customers?.customer_code ?? '',
      requested_delivery_date: o.requested_delivery_date ?? '',
      status: o.status,
      outstanding: (o.order_items ?? [])
        .filter((it: any) => Number(it.quantity) > Number(it.quantity_delivered))
        .map((it: any) =>
          `${it.products?.product_name}: ${
            Number(it.quantity) - Number(it.quantity_delivered)
          } ${it.products?.unit ?? ''}`.trim()
        ),
    }))
    .filter((r) => r.outstanding.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22 }}>Dispatch</h1>
        <p style={{ fontSize: 14, color: '#666', marginTop: 6 }}>
          Assign production-batch stock to open orders. Confirming a dispatch
          creates the delivery.
        </p>
      </div>

      {error && <p style={{ color: 'red', fontSize: 14 }}>{error}</p>}

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <DispatchQueueTable rows={rows} />
      </div>
    </div>
  )
}
