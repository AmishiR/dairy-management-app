import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// UNIFIED MODEL: staff and admin share the exact same pages under /staff.
// The only admin-exclusive route left is /admin/staff (Add Staff). There is
// no separate /admin/dashboard anymore — admin logs in and lands on /staff,
// same as everyone else, with one extra nav link.
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

  let user = null
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser
  } catch {
    // Supabase itself is unreachable (network error, outage — not your
    // server). Don't crash the request; treat as logged-out and let the
    // login page's own error handling show something reasonable, rather
    // than an unhandled exception taking down every page.
    const path = request.nextUrl.pathname
    if (path !== '/login' && path !== '/admin/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'auth_service_unavailable')
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  const path = request.nextUrl.pathname

  if (path === '/set-password') {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  const isPublicLoginPath = path === '/login' || path === '/admin/login'

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

    // A plain staff account can never reach anything under /admin/**
    // (except /admin/login itself, which is already public above).
    if (path.startsWith('/admin') && path !== '/admin/login' && isStaff) {
      const url = request.nextUrl.clone()
      url.pathname = '/staff'
      return NextResponse.redirect(url)
    }

    // Everyone — staff AND admin — lands on the SAME /staff dashboard.
    // No separate admin dashboard to route to anymore.
    if (isStaffOrAdmin && (path === '/login' || path === '/admin/login' || path === '/')) {
      const url = request.nextUrl.clone()
      url.pathname = '/staff'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}