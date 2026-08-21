'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'

export async function adminLogin(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    redirect(`/admin/login?error=${encodeURIComponent(signInError.message)}`)
  }

  // Critical check: authentication succeeding only proves this is a valid
  // Supabase user — it says nothing about whether they're an admin. This
  // is verified server-side here, not inferred from which form they used.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', signInData.user.id)
    .single()

  if (profile?.role !== 'admin') {
    await supabase.auth.signOut()
    redirect(
      `/admin/login?error=${encodeURIComponent(
        'This account does not have admin access.'
      )}`
    )
  }

  // Unified model: admin lands on the SAME dashboard as staff, not a
  // separate /admin/dashboard. Their extra "Add Staff" link shows up
  // automatically there because staff/layout.tsx checks the real role.
  redirect('/staff')
}