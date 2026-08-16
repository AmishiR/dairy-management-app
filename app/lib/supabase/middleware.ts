import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// This web app is staff/admin only. Customers are still blocked entirely.
// Staff can only reach /staff/**. Admin can reach both /staff/** and
// /admin/** (admin has all staff functionality, plus /admin/staff for
// inviting new staff).
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // /set-password must be reachable by someone who just clicked an invite
  // link — they have a session (from the invite token) but their role
  // could still be anything at this exact moment, so don't gate this route
  // on role at all, only on having a session.
  if (path === '/set-password') {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  const isPublicLoginPath = path === '/login' || path === '/admin/login'

  // Not logged in -> only the two login pages are reachable
  if (!user && !isPublicLoginPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'customer'
    const isAdmin = role === 'admin'
    const isStaff = role === 'staff'
    const isStaffOrAdmin = isStaff || isAdmin

    // Customer accounts never belong in this app at all.
    if (!isStaffOrAdmin && !isPublicLoginPath) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'customer_accounts_not_supported')
      return NextResponse.redirect(url)
    }

    // Staff can never reach /admin/** — including /admin/login while
    // already authenticated as staff (nothing for them to do there).
    if (path.startsWith('/admin') && isStaff) {
      const url = request.nextUrl.clone()
      url.pathname = '/staff'
      return NextResponse.redirect(url)
    }

    // Logged-in admin visiting /admin/login or the generic /login ->
    // send straight to their dashboard, nothing to log in for.
    if (isAdmin && (path === '/admin/login' || path === '/login' || path === '/')) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }

    // Logged-in staff visiting /login or root -> their dashboard.
    if (isStaff && (path === '/login' || path === '/')) {
      const url = request.nextUrl.clone()
      url.pathname = '/staff'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}