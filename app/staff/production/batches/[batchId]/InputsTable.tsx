'use client'

import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/app/components/DataTable'

export type InputRow = {
  id: string
  product_name: string
  unit: string
  quantity_used: number
  cost_per_unit: number
  total_cost: number
}

const columns: ColumnDef<InputRow>[] = [
  { accessorKey: 'product_name', header: 'Raw Material' },
  {
    accessorKey: 'quantity_used',
    header: 'Quantity Used',
    cell: ({ row }) => (
      <>
        {row.original.quantity_used} {row.original.unit}
      </>
    ),
  },
  {
    accessorKey: 'cost_per_unit',
    header: 'Cost / Unit (at the time)',
    cell: ({ row }) => <>₹{row.original.cost_per_unit}</>,
  },
  {
    accessorKey: 'total_cost',
    header: 'Total',
    cell: ({ row }) => <>₹{row.original.total_cost}</>,
  },
]

export default function InputsTable({ rows }: { rows: InputRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      filterPlaceholder="Filter inputs…"
      emptyMessage="No inputs recorded."
    />
  )
}
