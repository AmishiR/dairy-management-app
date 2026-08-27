'use client'

import { useState } from 'react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'

// Shared client-side data table: click-to-sort headers, a global text
// filter, and pagination. The filter box and pager only appear once there
// are enough rows to justify them, so small tables still render clean.
export default function DataTable<T>({
  columns,
  data,
  pageSize = 25,
  filterPlaceholder = 'Filter…',
  emptyMessage = 'Nothing to show.',
}: {
  columns: ColumnDef<T>[]
  data: T[]
  pageSize?: number
  filterPlaceholder?: string
  emptyMessage?: string
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const showFilter = data.length > 8
  const showPager = table.getPageCount() > 1
  const rows = table.getRowModel().rows

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {showFilter && (
        <div>
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={filterPlaceholder}
            style={{
              padding: '6px 8px',
              fontSize: 13,
              border: '1px solid #ccc',
              borderRadius: 4,
              width: 240,
            }}
          />
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      style={{
                        padding: '8px 4px',
                        cursor: canSort ? 'pointer' : 'default',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sorted === 'asc' ? ' ▲' : sorted === 'desc' ? ' ▼' : ''}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getAllLeafColumns().length}
                  style={{ padding: '12px 4px', fontSize: 13, color: '#999' }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f5f5f5', verticalAlign: 'top' }}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={{ padding: '8px 4px' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPager && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            style={pagerBtnStyle}
          >
            ← Prev
          </button>
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            style={pagerBtnStyle}
          >
            Next →
          </button>
          <span style={{ color: '#888' }}>{table.getFilteredRowModel().rows.length} rows</span>
        </div>
      )}
    </div>
  )
}

const pagerBtnStyle: React.CSSProperties = {
  fontSize: 12,
  cursor: 'pointer',
  background: 'none',
  border: '1px solid #ccc',
  borderRadius: 4,
  padding: '4px 10px',
}
