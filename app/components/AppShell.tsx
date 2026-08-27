import { logout } from '@/app/login/actions'

export default function AppShell({ displayName, role, children }: any) {
  const navLinks = [
    { href: '/staff', label: 'Dashboard' },
    { href: '/staff/products', label: 'Products' },
    { href: '/staff/orders', label: 'Orders' },
    { href: '/staff/deliveries', label: 'Deliveries' },
    { href: '/staff/pricing/customer-prices', label: 'Customer Prices' },
    { href: '/staff/pricing/internal-costs', label: 'Internal Costs' },
    { href: '/staff/production', label: 'Production' },
    
  ]

  return (
    <div className="ui-shell">
      <header className="ui-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
          <span className="ui-brand">PureDairy</span>
          <nav className="ui-nav" style={{ display: 'flex', gap: '8px' }}>
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}>{link.label}</a>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{displayName}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{role}</div>
          </div>
          <form action={logout}>
            <button className="ui-btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>Logout</button>
          </form>
        </div>
      </header>
      <main className="ui-main">{children}</main>
    </div>
  )
}