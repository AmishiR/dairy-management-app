import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import AppShell from '@/app/components/AppShell'

// Backup check — middleware already blocks non-admins from /admin/**, but
// this layout verifies independently rather than relying on one layer.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/staff')
  }

  return (
    <AppShell
      displayName={profile?.full_name ?? user.email ?? ''}
      role="admin"
      extraNavLinks={[{ href: '/admin/staff', label: 'Add Staff' }]}
    >
      {children}
    </AppShell>
  )
}