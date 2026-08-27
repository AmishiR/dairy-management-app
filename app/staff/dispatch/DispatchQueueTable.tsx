'use client'

import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/app/components/DataTable'

export type QueueRow = {
  order_id: string
  order_no: string
  customer: string
  customer_code: string
  requested_delivery_date: string
  status: string
  outstanding: string[]
}

const columns: ColumnDef<QueueRow>[] = [
  {
    accessorKey: 'order_no',
    header: 'Order',
    cell: ({ row }) => <span style={{ color: '#888' }}>{row.original.order_no}</span>,
  },
  {
    accessorKey: 'customer',
    header: 'Customer',
    cell: ({ row }) => (
      <>
        {row.original.customer}
        <div style={{ fontSize: 12, color: '#888' }}>{row.original.customer_code}</div>
      </>
    ),
  },
  { accessorKey: 'requested_delivery_date', header: 'Requested' },
  { accessorKey: 'status', header: 'Status' },
  {
    id: 'outstanding',
    header: 'Outstanding',
    enableSorting: false,
    accessorFn: (row) => row.outstanding.join(' '),
    cell: ({ row }) =>
      row.original.outstanding.map((line, i) => <div key={i}>{line}</div>),
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => (
      <Link
        href={`/staff/dispatch/${row.original.order_id}`}
        style={{ fontSize: 13, color: '#2563eb' }}
      >
        Dispatch →
      </Link>
    ),
  },
]

export default function DispatchQueueTable({ rows }: { rows: QueueRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      filterPlaceholder="Filter orders…"
      emptyMessage="No orders waiting to be dispatched."
    />
  )
}
