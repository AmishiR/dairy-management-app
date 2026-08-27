'use client'

import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/app/components/DataTable'

export type RawMaterialRow = {
  product_id: string
  product_code: string
  product_name: string
  unit: string
  current_cost: number | null
}

export type CostHistoryRow = {
  id: string
  product_name: string
  unit: string
  cost_price: number
  effective_from: string
  effective_to: string | null
  created_at: string
  set_by: string
}

const rawMaterialColumns: ColumnDef<RawMaterialRow>[] = [
  {
    accessorKey: 'product_code',
    header: 'Code',
    cell: ({ row }) => <span style={{ color: '#888' }}>{row.original.product_code}</span>,
  },
  { accessorKey: 'product_name', header: 'Raw Material' },
  { accessorKey: 'unit', header: 'Unit' },
  {
    accessorKey: 'current_cost',
    header: 'Current Cost',
    cell: ({ row }) =>
      row.original.current_cost !== null ? (
        <>
          ₹{row.original.current_cost} / {row.original.unit}
        </>
      ) : (
        <span style={{ color: '#999', fontSize: 13 }}>Not set</span>
      ),
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => (
      <Link
        href={`/staff/pricing/internal-costs/${row.original.product_id}`}
        style={{ fontSize: 13, color: '#2563eb' }}
      >
        Manage Cost →
      </Link>
    ),
  },
]

const historyColumns: ColumnDef<CostHistoryRow>[] = [
  { accessorKey: 'product_name', header: 'Raw Material' },
  {
    accessorKey: 'cost_price',
    header: 'Cost',
    cell: ({ row }) => (
      <>
        ₹{row.original.cost_price} / {row.original.unit}
      </>
    ),
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

export function RawMaterialsTable({ rows }: { rows: RawMaterialRow[] }) {
  return (
    <DataTable
      columns={rawMaterialColumns}
      data={rows}
      filterPlaceholder="Filter raw materials…"
      emptyMessage="No raw materials yet. Add one from Products first."
    />
  )
}

export function CostHistoryTable({ rows }: { rows: CostHistoryRow[] }) {
  return (
    <DataTable
      columns={historyColumns}
      data={rows}
      filterPlaceholder="Filter history…"
      emptyMessage="No cost changes recorded yet."
    />
  )
}
