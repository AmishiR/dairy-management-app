// Small pill for active/inactive-style statuses. Green when the value is
// "active", red otherwise. Plain component — safe to use from server or
// client components.
export default function StatusBadge({ status }: { status: string }) {
  const active = status === 'active'
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
      {status}
    </span>
  )
}
