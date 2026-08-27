'use client'

import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/app/components/DataTable'
import { updateDelivery } from './actions'

const deliveryStatuses = ['pending', 'partial', 'completed', 'cancelled']

export type DeliveryRow = {
  delivery_id: string
  delivery_date: string
  dm_number: string | null
  order_no: string | null
  organization_name: string
  customer_code: string
  phone: string | null
  due: number
  items: string[]
  batches: string[]
  order_total: number
  payment_status: string | null
  status: string
}

const columns: ColumnDef<DeliveryRow>[] = [
  { accessorKey: 'delivery_date', header: 'Date' },
  {
    accessorKey: 'dm_number',
    header: 'DM',
    cell: ({ row }) => row.original.dm_number ?? '-',
  },
  {
    accessorKey: 'order_no',
    header: 'Order',
    cell: ({ row }) => row.original.order_no ?? '-',
  },
  {
    accessorKey: 'organization_name',
    header: 'Customer',
    cell: ({ row }) => (
      <>
        {row.original.organization_name}
        <div style={{ fontSize: 12, color: '#888' }}>{row.original.customer_code}</div>
      </>
    ),
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => row.original.phone ?? '-',
  },
  {
    accessorKey: 'due',
    header: 'Due',
    cell: ({ row }) => (
      <span style={{ color: row.original.due > 0 ? '#a12622' : '#1e7b34', fontWeight: 600 }}>
        ₹{row.original.due}
      </span>
    ),
  },
  {
    id: 'items',
    header: 'Items',
    enableSorting: false,
    accessorFn: (row) => row.items.join(' '),
    cell: ({ row }) =>
      row.original.items.length ? (
        row.original.items.map((line, i) => <div key={i}>{line}</div>)
      ) : (
        <span style={{ color: '#999' }}>No items recorded</span>
      ),
  },
  {
    id: 'batches',
    header: 'Batches',
    enableSorting: false,
    accessorFn: (row) => row.batches.join(' '),
    cell: ({ row }) =>
      row.original.batches.length ? (
        row.original.batches.map((line, i) => <div key={i}>{line}</div>)
      ) : (
        <span style={{ color: '#999' }}>—</span>
      ),
  },
  {
    accessorKey: 'order_total',
    header: 'Order Amount',
    cell: ({ row }) => <>₹{row.original.order_total}</>,
  },
  {
    accessorKey: 'payment_status',
    header: 'Payment',
    cell: ({ row }) => row.original.payment_status ?? '-',
  },
  { accessorKey: 'status', header: 'Status' },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => (
      <form action={updateDelivery} style={{ display: 'flex', gap: 8 }}>
        <input type="hidden" name="delivery_id" value={row.original.delivery_id} />
        <select name="status" defaultValue={row.original.status} style={{ padding: 6 }}>
          {deliveryStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" style={{ padding: '6px 10px', cursor: 'pointer' }}>
          Save
        </button>
      </form>
    ),
  },
]

export default function DeliveriesTable({ rows }: { rows: DeliveryRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      filterPlaceholder="Filter deliveries…"
      emptyMessage="No deliveries yet."
    />
  )
}
