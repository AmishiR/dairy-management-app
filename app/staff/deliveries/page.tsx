import { createClient } from '@/app/lib/supabase/server'
import { updateDelivery } from './actions'

const deliveryStatuses = ['pending', 'partial', 'completed', 'cancelled']

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
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
          order_items(products(product_name, unit))
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22 }}>Deliveries Maintenance</h1>
        <p style={{ fontSize: 14, color: '#666', marginTop: 6 }}>
          View completed and pending deliveries with order details and customer dues.
        </p>
      </div>

      {error && <p style={{ color: 'red', fontSize: 14 }}>{error}</p>}

      {deliveriesRes.error && (
        <p style={{ color: 'red', fontSize: 14 }}>
          Error loading deliveries: {deliveriesRes.error.message}
        </p>
      )}

      {duesRes.error && (
        <p style={{ color: 'red', fontSize: 14 }}>
          Error loading dues: {duesRes.error.message}
        </p>
      )}

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Delivery List</h2>

        {deliveries.length === 0 ? (
          <p style={{ fontSize: 13, color: '#999' }}>No deliveries yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '8px 4px' }}>Date</th>
                  <th style={{ padding: '8px 4px' }}>DM</th>
                  <th style={{ padding: '8px 4px' }}>Order</th>
                  <th style={{ padding: '8px 4px' }}>Customer</th>
                  <th style={{ padding: '8px 4px' }}>Phone</th>
                  <th style={{ padding: '8px 4px' }}>Due</th>
                  <th style={{ padding: '8px 4px' }}>Items</th>
                  <th style={{ padding: '8px 4px' }}>Order Amount</th>
                  <th style={{ padding: '8px 4px' }}>Payment</th>
                  <th style={{ padding: '8px 4px' }}>Status</th>
                  <th style={{ padding: '8px 4px' }}></th>
                </tr>
              </thead>

              <tbody>
                {deliveries.map((delivery: any) => {
                  const due = dueForCustomer(delivery.customers?.customer_id)

                  return (
                    <tr key={delivery.delivery_id} style={{ borderBottom: '1px solid #f5f5f5', verticalAlign: 'top' }}>
                      <td style={{ padding: '8px 4px' }}>{delivery.delivery_date}</td>
                      <td style={{ padding: '8px 4px' }}>{delivery.dm_number ?? '-'}</td>
                      <td style={{ padding: '8px 4px' }}>{delivery.orders?.order_no ?? '-'}</td>

                      <td style={{ padding: '8px 4px' }}>
                        {delivery.customers?.organization_name}
                        <div style={{ fontSize: 12, color: '#888' }}>
                          {delivery.customers?.customer_code}
                        </div>
                      </td>

                      <td style={{ padding: '8px 4px' }}>
                        {delivery.customers?.phone ?? '-'}
                      </td>

                      <td
                        style={{
                          padding: '8px 4px',
                          color: due > 0 ? '#a12622' : '#1e7b34',
                          fontWeight: 600,
                        }}
                      >
                        ₹{due}
                      </td>

                      <td style={{ padding: '8px 4px' }}>
                        {delivery.delivery_items?.length ? (
                          delivery.delivery_items.map((item: any) => (
                            <div key={item.id}>
                              {item.order_items?.products?.product_name}: {item.quantity}{' '}
                              {item.order_items?.products?.unit}
                            </div>
                          ))
                        ) : (
                          <span style={{ color: '#999' }}>No items recorded</span>
                        )}
                      </td>

                      <td style={{ padding: '8px 4px' }}>
                        ₹{delivery.orders?.total_amount ?? 0}
                      </td>

                      <td style={{ padding: '8px 4px' }}>
                        {delivery.orders?.payment_status ?? '-'}
                      </td>

                      <td style={{ padding: '8px 4px' }}>
                        {delivery.status}
                      </td>

                      <td style={{ padding: '8px 4px' }}>
                        <form action={updateDelivery} style={{ display: 'flex', gap: 8 }}>
                          <input type="hidden" name="delivery_id" value={delivery.delivery_id} />

                          <select name="status" defaultValue={delivery.status} style={{ padding: 6 }}>
                            {deliveryStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>

                          <button type="submit" style={{ padding: '6px 10px', cursor: 'pointer' }}>
                            Save
                          </button>
                        </form>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}