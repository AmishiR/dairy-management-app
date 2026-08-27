'use client'

import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/app/components/DataTable'
import StatusBadge from '@/app/components/StatusBadge'

export type DirectoryRow = {
  customer_id: string
  customer_code: string
  organization_name: string
  customer_type: string
  status: string
  products_priced: number
}

const columns: ColumnDef<DirectoryRow>[] = [
  {
    accessorKey: 'customer_code',
    header: 'Code',
    cell: ({ row }) => <span style={{ color: '#888' }}>{row.original.customer_code}</span>,
  },
  { accessorKey: 'organization_name', header: 'Customer' },
  { accessorKey: 'customer_type', header: 'Type' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  { accessorKey: 'products_priced', header: 'Products Priced' },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => (
      <Link
        href={`/staff/pricing/customer-prices/${row.original.customer_id}`}
        style={{ fontSize: 13, color: '#2563eb' }}
      >
        Manage Prices →
      </Link>
    ),
  },
]

export default function CustomerDirectoryTable({ rows }: { rows: DirectoryRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      filterPlaceholder="Filter customers…"
      emptyMessage="No customers yet. Add one from Customers first."
    />
  )
}
