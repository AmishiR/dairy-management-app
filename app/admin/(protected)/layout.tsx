import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import AppShell from '@/app/components/AppShell'

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
    <AppShell displayName={profile?.full_name ?? user.email ?? ''} role={profile?.role ?? 'staff'}>
      {children}
    </AppShell>
  )
}