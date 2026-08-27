import { createClient } from '@/app/lib/supabase/server'
import DeliveriesTable from './DeliveriesTable'

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { error, success } = await searchParams
  const supabase = await createClient()

  const [deliveriesRes, duesRes] = await Promise.all([
    supabase
      .from('deliveries')
      .select(`
        delivery_id,
        delivery_date,
        dm_number,
        status,
        delivered_at,
        orders(order_no, total_amount, requested_delivery_date, payment_status),
        customers(customer_id, organization_name, customer_code, phone),
        delivery_items(
          id,
          quantity,
          unit_price,
          total_amount,
          order_items(products(product_name, unit)),
          dispatch_allocations(quantity, production_batches(batch_no))
        )
      `)
      .order('delivery_date', { ascending: false })
      .limit(100),

    supabase.from('customer_dues').select('*'),
  ])

  const deliveries = deliveriesRes.data ?? []
  const dues = duesRes.data ?? []

  function dueForCustomer(customerId: string) {
    const row = dues.find((due: any) => due.customer_id === customerId)
    return Number(row?.balance_due ?? 0)
  }

  const rows = deliveries.map((d: any) => ({
    delivery_id: d.delivery_id,
    delivery_date: d.delivery_date,
    dm_number: d.dm_number,
    order_no: d.orders?.order_no ?? null,
    organization_name: d.customers?.organization_name ?? '',
    customer_code: d.customers?.customer_code ?? '',
    phone: d.customers?.phone ?? null,
    due: dueForCustomer(d.customers?.customer_id),
    items: (d.delivery_items ?? []).map(
      (item: any) =>
        `${item.order_items?.products?.product_name}: ${item.quantity} ${item.order_items?.products?.unit ?? ''}`.trim()
    ),
    batches: (d.delivery_items ?? []).flatMap((item: any) =>
      (item.dispatch_allocations ?? []).map(
        (a: any) => `${a.production_batches?.batch_no ?? '?'} × ${a.quantity}`
      )
    ),
    order_total: d.orders?.total_amount ?? 0,
    payment_status: d.orders?.payment_status ?? null,
    status: d.status,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22 }}>Deliveries Maintenance</h1>
        <p style={{ fontSize: 14, color: '#666', marginTop: 6 }}>
          View completed and pending deliveries with order details and customer dues.
        </p>
      </div>

      {success === 'dispatched' && (
        <p style={{ color: '#1e7b34', fontSize: 14 }}>Dispatch confirmed — delivery created.</p>
      )}
      {error && <p style={{ color: 'red', fontSize: 14 }}>{error}</p>}

      {deliveriesRes.error && (
        <p style={{ color: 'red', fontSize: 14 }}>
          Error loading deliveries: {deliveriesRes.error.message}
        </p>
      )}

      {duesRes.error && (
        <p style={{ color: 'red', fontSize: 14 }}>Error loading dues: {duesRes.error.message}</p>
      )}

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Delivery List</h2>
        <DeliveriesTable rows={rows} />
      </section>
    </div>
  )
}
