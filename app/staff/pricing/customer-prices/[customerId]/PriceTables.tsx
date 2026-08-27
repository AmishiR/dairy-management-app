'use client'

import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/app/components/DataTable'

export type CurrentPriceRow = {
  id: string
  product_name: string
  selling_price: number
  effective_from: string
  set_by: string
}

export type PriceHistoryRow = CurrentPriceRow & {
  effective_to: string | null
  created_at: string
}

const currentColumns: ColumnDef<CurrentPriceRow>[] = [
  { accessorKey: 'product_name', header: 'Product' },
  {
    accessorKey: 'selling_price',
    header: 'Price',
    cell: ({ row }) => <>₹{row.original.selling_price}</>,
  },
  { accessorKey: 'effective_from', header: 'Since' },
  {
    accessorKey: 'set_by',
    header: 'Set By',
    cell: ({ row }) => <span style={{ color: '#888' }}>{row.original.set_by}</span>,
  },
]

const historyColumns: ColumnDef<PriceHistoryRow>[] = [
  { accessorKey: 'product_name', header: 'Product' },
  {
    accessorKey: 'selling_price',
    header: 'Price',
    cell: ({ row }) => <>₹{row.original.selling_price}</>,
  },
  { accessorKey: 'effective_from', header: 'From' },
  {
    accessorKey: 'effective_to',
    header: 'To',
    cell: ({ row }) =>
      row.original.effective_to ?? <span style={{ color: '#1e7b34', fontSize: 12 }}>current</span>,
  },
  {
    accessorKey: 'set_by',
    header: 'Set By',
    cell: ({ row }) => <span style={{ color: '#888' }}>{row.original.set_by}</span>,
  },
  {
    accessorKey: 'created_at',
    header: 'Set On',
    cell: ({ row }) => (
      <span style={{ color: '#888', fontSize: 12 }}>
        {new Date(row.original.created_at).toLocaleString()}
      </span>
    ),
  },
]

export function CurrentPricesTable({ rows }: { rows: CurrentPriceRow[] }) {
  return (
    <DataTable
      columns={currentColumns}
      data={rows}
      filterPlaceholder="Filter products…"
      emptyMessage="No prices set for this customer yet."
    />
  )
}

export function PriceHistoryTable({ rows }: { rows: PriceHistoryRow[] }) {
  return (
    <DataTable
      columns={historyColumns}
      data={rows}
      filterPlaceholder="Filter history…"
      emptyMessage="No history yet."
    />
  )
}
