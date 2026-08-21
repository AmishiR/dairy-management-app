import { logout } from '@/app/login/actions'

type NavLink = { href: string; label: string }

// Shared shell for the (now unified) dashboard. Base links are the same
// for everyone; extraNavLinks is how role-specific extras (Add Staff, for
// admin) get added on top — passed in by the layout that renders this.
export default function AppShell({
  displayName,
  role,
  extraNavLinks = [],
  children,
}: {
  displayName: string
  role: string
  extraNavLinks?: NavLink[]
  children: React.ReactNode
}) {
  const baseNavLinks: NavLink[] = [
    { href: '/staff', label: 'Dashboard' },
    { href: '/staff/products', label: 'Products' },
    { href: '/staff/pricing/customer-prices', label: 'Customer Prices' },
    { href: '/staff/pricing/internal-costs', label: 'Internal Costs' },
    { href: '/staff/production', label: 'Production' },
  ]

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          borderBottom: '1px solid #ddd',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <strong>Dairy Dashboard</strong>
          <nav style={{ display: 'flex', gap: 16, fontSize: 14 }}>
            {[...baseNavLinks, ...extraNavLinks].map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, color: '#555' }}>
            {displayName} ({role})
          </span>
          <form action={logout}>
            <button type="submit" style={{ cursor: 'pointer' }}>
              Log out
            </button>
          </form>
        </div>
      </header>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  )
}