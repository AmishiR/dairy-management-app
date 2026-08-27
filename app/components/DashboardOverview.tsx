import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardOverview() {
  const supabase = await createClient()

  const [
    pendingOrdersRes,
    pendingPaymentsRes,
    duesRes,
    nextDeliveryDateRes,
  ] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'order_id, order_no, requested_delivery_date, status, total_amount, customers(organization_name)'
      )
      .not('status', 'in', '(delivered,cancelled)')
      .order('requested_delivery_date', { ascending: true })
      .limit(10),

    supabase
      .from('payments')
      .select(
        'payment_id, amount, transaction_reference, submitted_at, customers(organization_name)'
      )
      .in('status', ['pending', 'submitted'])
      .order('submitted_at', { ascending: true })
      .limit(10),

    supabase
      .from('customer_dues')
      .select('*')
      .gt('balance_due', 0)
      .order('balance_due', { ascending: false })
      .limit(5),

    supabase.rpc('next_valid_delivery_date'),
  ])

  const pendingOrders = pendingOrdersRes.data ?? []
  const pendingPayments = pendingPaymentsRes.data ?? []
  const dues = duesRes.data ?? []
  const nextDeliveryDate = nextDeliveryDateRes.data as string | null

  const { data: productionRequirements } = nextDeliveryDate
    ? await supabase
        .from('production_requirements')
        .select('*')
        .eq('requested_delivery_date', nextDeliveryDate)
    : { data: [] }

  return (
    <div>
      {/* Dashboard Header */}
      <div
        className="ui-page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 className="ui-page-title">Dashboard</h1>
          <p className="ui-page-subtitle">
            Today&apos;s operations at a glance.
          </p>
        </div>

        {/* Add Staff */}
        <Link
          href="/admin/staff"
          className="ui-btn-primary"
          style={{
            textDecoration: 'none',
            padding: '10px 18px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          + Add New Staff
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="ui-summary-row">
        <SummaryCard
          label="Pending Orders"
          value={pendingOrders.length}
        />

        <SummaryCard
          label="Payments Awaiting Verification"
          value={pendingPayments.length}
        />

        <SummaryCard
          label="Customers With Dues"
          value={dues.length}
        />

        <SummaryCard
          label="Next Production Date"
          value={
            nextDeliveryDate
              ? new Date(nextDeliveryDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'
          }
        />
      </div>

      {/* Dashboard Cards */}
      <div
        className="ui-grid-2"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 20,
          marginTop: 24,
        }}
      >
        {/* Pending Orders */}
        <div className="ui-card">
          <h2 className="ui-card-title">
            Pending Orders / Deliveries
          </h2>

          {pendingOrders.length === 0 && (
            <div className="ui-empty">
              No pending orders.
            </div>
          )}

          {pendingOrders.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {pendingOrders.map((o: any) => (
                <Row key={o.order_id}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      minWidth: 0,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {o.order_no}
                    </span>

                    <span
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: 12,
                        marginTop: 3,
                      }}
                    >
                      {o.customers?.organization_name ?? 'Unknown customer'}
                    </span>
                  </div>

                  <div
                    style={{
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    <StatusBadge status={o.status} />

                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text-muted)',
                        marginTop: 5,
                      }}
                    >
                      {o.requested_delivery_date}
                    </div>
                  </div>
                </Row>
              ))}
            </div>
          )}
        </div>

        {/* Payments */}
        <div className="ui-card">
          <h2 className="ui-card-title">
            Payments Awaiting Verification
          </h2>

          {pendingPayments.length === 0 && (
            <div className="ui-empty">
              No payments waiting.
            </div>
          )}

          {pendingPayments.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {pendingPayments.map((p: any) => (
                <Row key={p.payment_id}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      minWidth: 0,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {p.customers?.organization_name ??
                        'Unknown customer'}
                    </span>

                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text-muted)',
                        marginTop: 3,
                      }}
                    >
                      Ref: {p.transaction_reference}
                    </span>
                  </div>

                  <div
                    style={{
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: 'var(--color-accent)',
                      }}
                    >
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </div>
                  </div>
                </Row>
              ))}
            </div>
          )}
        </div>

        {/* Production */}
        <div
          className="ui-card"
          style={{
            background: 'var(--color-accent)',
            color: 'white',
          }}
        >
          <h2
            className="ui-card-title"
            style={{
              color: 'white',
              marginBottom: 12,
            }}
          >
            Production Needed
            {nextDeliveryDate
              ? ` — ${new Date(nextDeliveryDate).toLocaleDateString(
                  'en-IN',
                  {
                    day: '2-digit',
                    month: 'short',
                  }
                )}`
              : ''}
          </h2>

          {(!productionRequirements ||
            productionRequirements.length === 0) && (
            <div
              className="ui-empty"
              style={{
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              Nothing to produce for the next delivery date yet.
            </div>
          )}

          {productionRequirements &&
            productionRequirements.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {productionRequirements.map((r: any) => (
                  <div
                    key={r.product_id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 0',
                      borderBottom:
                        '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>
                      {r.product_name}
                    </span>

                    <span style={{ fontWeight: 700 }}>
                      {r.total_quantity_required} units
                    </span>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Customer Dues */}
        <div className="ui-card">
          <h2 className="ui-card-title">
            Top Customer Dues
          </h2>

          {dues.length === 0 && (
            <div className="ui-empty">
              No outstanding balances.
            </div>
          )}

          {dues.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {dues.map((d: any) => (
                <Row key={d.customer_id}>
                  <span style={{ fontWeight: 600 }}>
                    {d.organization_name}
                  </span>

                  <span
                    style={{
                      color: 'var(--color-danger)',
                      fontWeight: 700,
                    }}
                  >
                    ₹{Number(d.balance_due).toLocaleString('en-IN')}
                  </span>
                </Row>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Responsive Grid */}
      <style>{`
        @media (max-width: 900px) {
          .ui-grid-2 {
            grid-template-columns: 1fr !important;
          }

          .ui-page-header {
            align-items: flex-start !important;
            gap: 16px;
          }
        }

        @media (max-width: 600px) {
          .ui-page-header {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  )
}

/* Summary Card */
function SummaryCard({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div
      className="ui-summary-card"
      style={{
        borderBottom:
          '4px solid var(--color-accent-soft)',
      }}
    >
      <div
        className="ui-summary-label"
        style={{
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontSize: 11,
        }}
      >
        {label}
      </div>

      <div
        className="ui-summary-value"
        style={{
          color: 'var(--color-accent)',
        }}
      >
        {value}
      </div>
    </div>
  )
}

/* Dashboard Row */
function Row({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        fontSize: 13.5,
        padding: '12px 0',
        borderBottom:
          '1px solid var(--color-surface-2)',
      }}
    >
      {children}
    </div>
  )
}

/* Status Badge */
function StatusBadge({
  status,
}: {
  status: string
}) {
  const variant =
    status === 'delivered'
      ? 'ui-badge-success'
      : status === 'cancelled'
        ? 'ui-badge-danger'
        : status === 'pending'
          ? 'ui-badge-warning'
          : 'ui-badge-accent'

  return (
    <span
      className={`ui-badge ${variant}`}
      style={{
        fontSize: 10,
        textTransform: 'capitalize',
      }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}