import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { logout } from '@/app/login/actions'

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'staff' && profile?.role !== 'admin') {
    redirect('/login')
  }

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
          <nav style={{ display: 'flex', gap: 16, fontSize: 14, flexWrap: 'wrap' }}>
            <Link href="/staff">Dashboard</Link>
            <Link href="/staff/products">Products</Link>
            <Link href="/staff/pricing/customer-prices">Customer Prices</Link>
            <Link href="/staff/pricing/internal-costs">Internal Costs</Link>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, color: '#555' }}>
            {profile?.full_name ?? user.email} ({profile?.role})
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