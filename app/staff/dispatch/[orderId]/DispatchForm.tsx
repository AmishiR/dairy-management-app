'use client'

import { useMemo, useState } from 'react'
import { confirmDispatch } from '../actions'

type Batch = {
  batch_id: string
  batch_no: string
  production_date: string
  remaining: number
}

export type DispatchLine = {
  order_item_id: string
  product_name: string
  unit: string
  ordered: number
  delivered: number
  remaining: number
  batches: Batch[]
}

const num = (s: string) => {
  const v = parseFloat(s)
  return Number.isFinite(v) ? v : 0
}
const EPS = 1e-6

// Fill `qty` from the batches in order (they arrive oldest-first), capping
// each at its remaining stock.
function suggest(qty: number, batches: Batch[]): Record<string, string> {
  let left = qty
  const out: Record<string, string> = {}
  for (const b of batches) {
    if (left <= EPS) break
    const take = Math.min(left, b.remaining)
    if (take > 0) out[b.batch_id] = String(take)
    left -= take
  }
  return out
}

type LineState = { dispatchQty: string; alloc: Record<string, string> }

export default function DispatchForm({
  orderId,
  lines,
}: {
  orderId: string
  lines: DispatchLine[]
}) {
  const [state, setState] = useState<Record<string, LineState>>(() => {
    const init: Record<string, LineState> = {}
    for (const l of lines) {
      const startQty = Math.min(l.remaining, sumRemaining(l.batches))
      init[l.order_item_id] = {
        dispatchQty: startQty > 0 ? String(startQty) : '',
        alloc: suggest(startQty, l.batches),
      }
    }
    return init
  })
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [dmNumber, setDmNumber] = useState('')

  function setDispatchQty(l: DispatchLine, value: string) {
    setState((prev) => ({
      ...prev,
      [l.order_item_id]: { dispatchQty: value, alloc: suggest(num(value), l.batches) },
    }))
  }

  function setAlloc(orderItemId: string, batchId: string, value: string) {
    setState((prev) => ({
      ...prev,
      [orderItemId]: {
        ...prev[orderItemId],
        alloc: { ...prev[orderItemId].alloc, [batchId]: value },
      },
    }))
  }

  const perLine = useMemo(() => {
    return lines.map((l) => {
      const s = state[l.order_item_id]
      const dispatchQty = num(s.dispatchQty)
      const allocated = Object.values(s.alloc).reduce((sum, v) => sum + num(v), 0)
      const overBatch = l.batches.some((b) => num(s.alloc[b.batch_id] ?? '') > b.remaining + EPS)
      const matches = Math.abs(allocated - dispatchQty) < EPS
      const valid =
        dispatchQty <= EPS
          ? true // an untouched line is fine, it just won't be dispatched
          : dispatchQty <= l.remaining + EPS && matches && !overBatch
      return { line: l, dispatchQty, allocated, overBatch, matches, valid }
    })
  }, [lines, state])

  const anyToDispatch = perLine.some((p) => p.dispatchQty > EPS)
  const allValid = perLine.every((p) => p.valid)
  const canSubmit = anyToDispatch && allValid && !!deliveryDate

  const payload = useMemo(
    () =>
      JSON.stringify(
        perLine
          .filter((p) => p.dispatchQty > EPS)
          .map((p) => ({
            order_item_id: p.line.order_item_id,
            allocations: Object.entries(state[p.line.order_item_id].alloc)
              .map(([batch_id, v]) => ({ batch_id, quantity: num(v) }))
              .filter((a) => a.quantity > 0),
          }))
      ),
    [perLine, state]
  )

  return (
    <form action={confirmDispatch} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="lines" value={payload} />

      {perLine.map(({ line, dispatchQty, allocated, overBatch, matches }) => (
        <div key={line.order_item_id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
            <h2 style={{ fontSize: 16 }}>{line.product_name}</h2>
            <span style={{ fontSize: 12, color: '#888' }}>
              ordered {line.ordered} {line.unit} · delivered {line.delivered} · outstanding{' '}
              {line.remaining} {line.unit}
            </span>
          </div>

          <label style={{ fontSize: 14, display: 'block', marginTop: 12 }}>
            Dispatch now ({line.unit})
            <input
              type="number"
              step="0.001"
              min="0"
              max={line.remaining}
              value={state[line.order_item_id].dispatchQty}
              onChange={(e) => setDispatchQty(line, e.target.value)}
              style={{ display: 'block', width: 160, padding: 8, marginTop: 4 }}
            />
          </label>

          {line.batches.length === 0 ? (
            <p style={{ fontSize: 13, color: '#a12622', marginTop: 12 }}>
              No batch stock available for this product yet.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginTop: 12 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '6px 4px' }}>Batch</th>
                  <th style={{ padding: '6px 4px' }}>Produced</th>
                  <th style={{ padding: '6px 4px' }}>Remaining</th>
                  <th style={{ padding: '6px 4px' }}>Allocate ({line.unit})</th>
                </tr>
              </thead>
              <tbody>
                {line.batches.map((b) => {
                  const v = state[line.order_item_id].alloc[b.batch_id] ?? ''
                  const over = num(v) > b.remaining + EPS
                  return (
                    <tr key={b.batch_id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '6px 4px', color: '#888' }}>
                        {b.batch_no}
                        <div style={{ fontSize: 11 }}>{b.production_date}</div>
                      </td>
                      <td style={{ padding: '6px 4px' }} />
                      <td style={{ padding: '6px 4px' }}>
                        {b.remaining} {line.unit}
                      </td>
                      <td style={{ padding: '6px 4px' }}>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          max={b.remaining}
                          value={v}
                          onChange={(e) => setAlloc(line.order_item_id, b.batch_id, e.target.value)}
                          style={{
                            width: 120,
                            padding: 6,
                            border: `1px solid ${over ? '#a12622' : '#ccc'}`,
                            borderRadius: 4,
                          }}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {dispatchQty > EPS && (
            <p
              style={{
                fontSize: 13,
                marginTop: 10,
                color: matches && !overBatch ? '#1e7b34' : '#a12622',
              }}
            >
              Allocated {Number(allocated.toFixed(3))} / {Number(dispatchQty.toFixed(3))} {line.unit}
              {overBatch && ' · a batch allocation exceeds its remaining stock'}
              {!matches && !overBatch && ' · must match the dispatch quantity'}
            </p>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 14 }}>
          Delivery date
          <input
            type="date"
            name="delivery_date"
            required
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            style={{ display: 'block', padding: 8, marginTop: 4 }}
          />
        </label>
        <label style={{ fontSize: 14 }}>
          DM number (optional)
          <input
            name="dm_number"
            value={dmNumber}
            onChange={(e) => setDmNumber(e.target.value)}
            placeholder="auto"
            style={{ display: 'block', padding: 8, marginTop: 4 }}
          />
        </label>
      </div>

      <div>
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            padding: '10px 18px',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            opacity: canSubmit ? 1 : 0.5,
          }}
        >
          Confirm Dispatch & Create Delivery
        </button>
        {!anyToDispatch && (
          <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
            Enter a dispatch quantity for at least one product.
          </p>
        )}
      </div>
    </form>
  )
}

function sumRemaining(batches: Batch[]) {
  return batches.reduce((s, b) => s + b.remaining, 0)
}
