'use client'

import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/app/components/DataTable'
import StatusBadge from '@/app/components/StatusBadge'
import { toggleCustomerStatus } from './actions'

export type CustomerRow = {
  customer_id: string
  customer_code: string
  organization_name: string
  customer_type: string
  contact_person: string | null
  phone: string | null
  email: string | null
  status: string
}

const columns: ColumnDef<CustomerRow>[] = [
  {
    accessorKey: 'customer_code',
    header: 'Code',
    cell: ({ row }) => <span style={{ color: '#888' }}>{row.original.customer_code}</span>,
  },
  { accessorKey: 'organization_name', header: 'Organization' },
  { accessorKey: 'customer_type', header: 'Type' },
  {
    accessorKey: 'contact_person',
    header: 'Contact',
    cell: ({ row }) => row.original.contact_person ?? '—',
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => row.original.phone ?? '—',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => {
      const c = row.original
      return (
        <div style={{ whiteSpace: 'nowrap' }}>
          <Link
            href={`/staff/customers/${c.customer_id}`}
            style={{ fontSize: 13, color: '#2563eb', marginRight: 12 }}
          >
            Edit
          </Link>
          <form
            action={toggleCustomerStatus.bind(null, c.customer_id, c.status)}
            style={{ display: 'inline' }}
          >
            <button
              type="submit"
              style={{
                fontSize: 12,
                cursor: 'pointer',
                background: 'none',
                border: '1px solid #ccc',
                borderRadius: 4,
                padding: '2px 8px',
              }}
            >
              {c.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
          </form>
        </div>
      )
    },
  },
]

export default function CustomersTable({ rows }: { rows: CustomerRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      filterPlaceholder="Filter customers…"
      emptyMessage="No customers yet."
    />
  )
}
