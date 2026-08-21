import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import AppShell from '@/app/components/AppShell'

// This is now the ONE dashboard layout for BOTH staff and admin. The only
// difference between what a staff vs. admin user sees here is the
// "Add Staff" nav link — added automatically below when role === 'admin'.
// There is no separate admin layout/dashboard anymore.
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

  const extraNavLinks =
    profile?.role === 'admin' ? [{ href: '/admin/staff', label: 'Add Staff' }] : []

  return (
    <AppShell
      displayName={profile?.full_name ?? user.email ?? ''}
      role={profile?.role ?? 'staff'}
      extraNavLinks={extraNavLinks}
    >
      {children}
    </AppShell>
  )
}