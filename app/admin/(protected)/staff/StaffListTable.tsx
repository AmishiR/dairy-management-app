'use client'

import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/app/components/DataTable'

export type StaffRow = {
  id: string
  role: string
  full_name: string | null
  status: string
  created_at: string
}

const columns: ColumnDef<StaffRow>[] = [
  {
    accessorKey: 'full_name',
    header: 'Name',
    cell: ({ row }) => row.original.full_name ?? '(not set yet)',
  },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'status', header: 'Status' },
  {
    accessorKey: 'created_at',
    header: 'Added',
    cell: ({ row }) => (
      <span style={{ color: '#888', fontSize: 12 }}>
        {new Date(row.original.created_at).toLocaleDateString()}
      </span>
    ),
  },
]

export default function StaffListTable({ rows }: { rows: StaffRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      filterPlaceholder="Filter staff…"
      emptyMessage="None yet."
    />
  )
}
