'use client'

import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/app/components/DataTable'

export type BatchRow = {
  batch_id: string
  batch_no: string
  product_name: string
  production_date: string
  quantity_produced: number
  unit: string
  total_input_cost: number
  cost_per_unit: number
  yield_ratio: number | null
}

const columns: ColumnDef<BatchRow>[] = [
  {
    accessorKey: 'batch_no',
    header: 'Batch',
    cell: ({ row }) => <span style={{ color: '#888' }}>{row.original.batch_no}</span>,
  },
  { accessorKey: 'product_name', header: 'Product' },
  { accessorKey: 'production_date', header: 'Date' },
  {
    accessorKey: 'quantity_produced',
    header: 'Qty Produced',
    cell: ({ row }) => (
      <>
        {row.original.quantity_produced} {row.original.unit}
      </>
    ),
  },
  {
    accessorKey: 'total_input_cost',
    header: 'Total Cost',
    cell: ({ row }) => <>₹{row.original.total_input_cost}</>,
  },
  {
    accessorKey: 'cost_per_unit',
    header: 'Cost / Unit',
    cell: ({ row }) => <>₹{row.original.cost_per_unit}</>,
  },
  {
    accessorKey: 'yield_ratio',
    header: 'Yield (kg / L milk)',
    cell: ({ row }) =>
      row.original.yield_ratio !== null ? row.original.yield_ratio.toFixed(3) : '—',
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => (
      <Link
        href={`/staff/production/batches/${row.original.batch_id}`}
        style={{ fontSize: 13, color: '#2563eb' }}
      >
        Details →
      </Link>
    ),
  },
]

export default function BatchesTable({ rows }: { rows: BatchRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      filterPlaceholder="Filter batches…"
      emptyMessage="No batches recorded yet."
    />
  )
}
