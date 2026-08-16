import { createClient } from '@/app/lib/supabase/server'
import { updateOrder } from './actions'

const orderStatuses = [
  'pending',
  'confirmed',
  'processing',
  'out_for_delivery',
  'partially_delivered',
  'delivered',
  'cancelled',
]

const paymentStatuses = ['unpaid', 'partially_paid', 'paid', 'refunded']

export default async function OrdersPage({
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
      order_date,
      requested_delivery_date,
      status,
      payment_status,
      total_amount,
      payment_upfront,
      notes,
      customers(organization_name, customer_code, phone),
      order_items(
        id,
        quantity,
        unit_price,
        total_amount,
        quantity_delivered,
        products(product_name, unit)
      )
    `)
    .order('order_date', { ascending: false })
    .limit(100)

  if (loadError) {
    return (
      <div>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>Orders</h1>
        <p style={{ color: 'red' }}>Error loading orders: {loadError.message}</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22 }}>Orders Management</h1>
        <p style={{ fontSize: 14, color: '#666', marginTop: 6 }}>
          Review customer orders, update order progress, and keep payment status current.
        </p>
      </div>

      {error && <p style={{ color: 'red', fontSize: 14 }}>{error}</p>}

      {!orders || orders.length === 0 ? (
        <p style={{ fontSize: 13, color: '#999' }}>No orders yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map((order: any) => (
            <section key={order.order_id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: 16, marginBottom: 4 }}>{order.order_no ?? 'Order'}</h2>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    {order.customers?.organization_name} · {order.customers?.customer_code}
                    {order.customers?.phone ? ` · ${order.customers.phone}` : ''}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>₹{order.total_amount}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    Delivery: {order.requested_delivery_date ?? 'not set'}
                  </div>
                </div>
              </div>

              <div style={{ overflowX: 'auto', marginTop: 14 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                      <th style={{ padding: '8px 4px' }}>Product</th>
                      <th style={{ padding: '8px 4px' }}>Qty</th>
                      <th style={{ padding: '8px 4px' }}>Delivered</th>
                      <th style={{ padding: '8px 4px' }}>Rate</th>
                      <th style={{ padding: '8px 4px' }}>Amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {order.order_items?.map((item: any) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '8px 4px' }}>{item.products?.product_name}</td>
                        <td style={{ padding: '8px 4px' }}>{item.quantity} {item.products?.unit}</td>
                        <td style={{ padding: '8px 4px' }}>{item.quantity_delivered}</td>
                        <td style={{ padding: '8px 4px' }}>₹{item.unit_price}</td>
                        <td style={{ padding: '8px 4px' }}>
                          ₹{item.total_amount ?? Number(item.quantity) * Number(item.unit_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form
                action={updateOrder}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 2fr auto',
                  gap: 12,
                  alignItems: 'end',
                  marginTop: 16,
                }}
              >
                <input type="hidden" name="order_id" value={order.order_id} />

                <label style={{ fontSize: 14 }}>
                  Order Status
                  <select name="status" defaultValue={order.status} style={{ width: '100%', padding: 8, marginTop: 4 }}>
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label style={{ fontSize: 14 }}>
                  Payment
                  <select name="payment_status" defaultValue={order.payment_status} style={{ width: '100%', padding: 8, marginTop: 4 }}>
                    {paymentStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label style={{ fontSize: 14 }}>
                  Notes
                  <input name="notes" defaultValue={order.notes ?? ''} style={{ width: '100%', padding: 8, marginTop: 4 }} />
                </label>

                <button type="submit" style={{ padding: '9px 14px', cursor: 'pointer' }}>
                  Save
                </button>
              </form>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}