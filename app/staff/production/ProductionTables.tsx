'use client'

import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/app/components/DataTable'

export type StockRow = {
  product_id: string
  product_name: string
  unit: string
  current_stock: number
}

export type RecentBatchRow = {
  batch_id: string
  batch_no: string
  product_name: string
  production_date: string
  quantity_produced: number
  unit: string
  cost_per_unit: number
}

const stockColumns: ColumnDef<StockRow>[] = [
  { accessorKey: 'product_name', header: 'Item' },
  {
    accessorKey: 'current_stock',
    header: 'Stock',
    cell: ({ row }) => (
      <span style={{ fontWeight: 600 }}>
        {row.original.current_stock} {row.original.unit}
      </span>
    ),
  },
]

const recentBatchColumns: ColumnDef<RecentBatchRow>[] = [
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
    accessorKey: 'cost_per_unit',
    header: 'Cost / Unit',
    cell: ({ row }) => <>₹{row.original.cost_per_unit}</>,
  },
]

export function StockTable({ rows }: { rows: StockRow[] }) {
  return (
    <DataTable
      columns={stockColumns}
      data={rows}
      filterPlaceholder="Filter items…"
      emptyMessage="No stock recorded yet."
    />
  )
}

export function RecentBatchesTable({ rows }: { rows: RecentBatchRow[] }) {
  return (
    <DataTable
      columns={recentBatchColumns}
      data={rows}
      filterPlaceholder="Filter batches…"
      emptyMessage="No batches recorded yet."
    />
  )
}
