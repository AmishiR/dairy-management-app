'use client'

import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/app/components/DataTable'
import { toggleProductActive } from './actions'

export type ProductRow = {
  product_id: string
  product_code: string
  product_name: string
  category: string
  unit: string
  active: boolean
}

const columns: ColumnDef<ProductRow>[] = [
  {
    accessorKey: 'product_code',
    header: 'Code',
    cell: ({ row }) => <span style={{ color: '#888' }}>{row.original.product_code}</span>,
  },
  { accessorKey: 'product_name', header: 'Name' },
  { accessorKey: 'category', header: 'Category' },
  { accessorKey: 'unit', header: 'Unit' },
  {
    accessorKey: 'active',
    header: 'Status',
    cell: ({ row }) => {
      const active = row.original.active
      return (
        <span
          style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 12,
            background: active ? '#e6f4ea' : '#fdecea',
            color: active ? '#1e7b34' : '#a12622',
          }}
        >
          {active ? 'active' : 'inactive'}
        </span>
      )
    },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => (
      <form action={toggleProductActive.bind(null, row.original.product_id, row.original.active)}>
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
          {row.original.active ? 'Deactivate' : 'Activate'}
        </button>
      </form>
    ),
  },
]

export default function ProductsTable({ rows }: { rows: ProductRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      filterPlaceholder="Filter products…"
      emptyMessage="None yet."
    />
  )
}
