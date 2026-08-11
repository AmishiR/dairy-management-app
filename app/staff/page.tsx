import { createClient } from '@/app/lib/supabase/server'

export default async function StaffDashboardPage() {
  const supabase = await createClient()

  // Run all the dashboard queries in parallel — they're independent of
  // each other, no reason to wait for one before starting the next.
  const [
    pendingOrdersRes,
    pendingPaymentsRes,
    duesRes,
    nextDeliveryDateRes,
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('order_id, order_no, requested_delivery_date, status, total_amount, customers(organization_name)')
      .not('status', 'in', '(delivered,cancelled)')
      .order('requested_delivery_date', { ascending: true })
      .limit(10),

    supabase
      .from('payments')
      .select('payment_id, amount, transaction_reference, submitted_at, customers(organization_name)')
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

  // Tonight's production requirements — what needs to be made for the
  // next valid delivery date, aggregated from all pending orders.
  const { data: productionRequirements } = nextDeliveryDate
    ? await supabase
        .from('production_requirements')
        .select('*')
        .eq('requested_delivery_date', nextDeliveryDate)
    : { data: [] }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 22 }}>Dashboard</h1>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <SummaryCard label="Pending Orders" value={pendingOrders.length} />
        <SummaryCard label="Payments Awaiting Verification" value={pendingPayments.length} />
        <SummaryCard label="Customers With Dues" value={dues.length} />
        <SummaryCard
          label="Next Production Date"
          value={nextDeliveryDate ? new Date(nextDeliveryDate).toLocaleDateString() : '—'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Pending deliveries */}
        <Section title="Pending Orders / Deliveries">
          {pendingOrders.length === 0 && <EmptyState text="No pending orders." />}
          {pendingOrders.map((o) => (
            <Row key={o.order_id}>
              <span>{o.order_no}</span>
              {/* @ts-expect-error - joined relation shape */}
              <span>{o.customers?.organization_name}</span>
              <span>{o.requested_delivery_date}</span>
              <StatusBadge status={o.status} />
            </Row>
          ))}
        </Section>

        {/* Payments awaiting verification */}
        <Section title="Payments Awaiting Verification">
          {pendingPayments.length === 0 && <EmptyState text="No payments waiting." />}
          {pendingPayments.map((p) => (
            <Row key={p.payment_id}>
              {/* @ts-expect-error - joined relation shape */}
              <span>{p.customers?.organization_name}</span>
              <span>₹{p.amount}</span>
              <span style={{ fontSize: 12, color: '#888' }}>{p.transaction_reference}</span>
            </Row>
          ))}
        </Section>

        {/* Tonight's production requirements */}
        <Section title={`Production Needed (${nextDeliveryDate ?? '—'})`}>
          {(!productionRequirements || productionRequirements.length === 0) && (
            <EmptyState text="Nothing to produce for the next delivery date yet." />
          )}
          {productionRequirements?.map((r: any) => (
            <Row key={r.product_id}>
              <span>{r.product_name}</span>
              <span>{r.total_quantity_required}</span>
            </Row>
          ))}
        </Section>

        {/* Customer dues */}
        <Section title="Top Customer Dues">
          {dues.length === 0 && <EmptyState text="No outstanding balances." />}
          {dues.map((d: any) => (
            <Row key={d.customer_id}>
              <span>{d.organization_name}</span>
              <span>₹{d.balance_due}</span>
            </Row>
          ))}
        </Section>
      </div>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        flex: '1 1 200px',
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 13, color: '#888' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600 }}>{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        fontSize: 14,
        borderBottom: '1px solid #f0f0f0',
        paddingBottom: 8,
      }}
    >
      {children}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p style={{ fontSize: 13, color: '#999' }}>{text}</p>
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 12,
        background: '#eef',
        color: '#334',
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  )
}