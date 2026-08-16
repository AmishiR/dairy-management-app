'use server'

import { createClient } from '@/app/lib/supabase/server'
import { createAdminClient } from '@/app/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_ROLES = ['staff'] as const

export async function inviteStaff(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const role = formData.get('role') as string

  // ------------------------------------------------------------
  // Authorization check — independent of the UI. This must not assume
  // "only admins can see this form" is enough. A staff user (or anyone
  // with a valid session) could call this Server Action directly, since
  // Server Actions are reachable as their own endpoint regardless of
  // which page rendered the form that points to them.
  // ------------------------------------------------------------
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    // Do not reveal internals — just refuse. Someone hitting this path
    // without being an admin is either confused or probing; either way,
    // no useful information goes back.
    redirect('/staff?error=' + encodeURIComponent('Not authorized.'))
  }

  // ------------------------------------------------------------
  // Input validation
  // ------------------------------------------------------------
  if (!email || !EMAIL_REGEX.test(email)) {
    redirect(`/admin/staff?error=${encodeURIComponent('Enter a valid email address.')}`)
  }

  if (!ALLOWED_ROLES.includes(role as any)) {
    redirect(`/admin/staff?error=${encodeURIComponent('Invalid role.')}`)
  }

  // ------------------------------------------------------------
  // Send the invite via the Admin API (service_role key, server-only).
  // The role is passed as user metadata; fn_handle_new_user (migration 08)
  // reads it when creating the profiles row, so the invited user is
  // created with role='staff' from the moment their auth.users row exists
  // — never defaulting to 'customer' and needing a follow-up promotion.
  // ------------------------------------------------------------
  const adminClient = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { role },
    redirectTo: `${siteUrl}/set-password`,
  })

  if (inviteError) {
    redirect(`/admin/staff?error=${encodeURIComponent(inviteError.message)}`)
  }

  revalidatePath('/admin/staff')
  redirect('/admin/staff?success=1')
}