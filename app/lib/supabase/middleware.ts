import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// This web app is staff/admin ONLY. There is no customer-facing area —
// customers will use a separate mobile app later, connecting to this same
// Supabase project directly with the customer-side RLS policies.
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

  // Not logged in -> only /login is reachable
  if (!user && path !== '/login') {
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
    const isStaff = role === 'staff' || role === 'admin'

    // A customer account should never reach this app — sign out and bounce
    // to /login with an explanatory message.
    if (!isStaff && path !== '/login') {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'customer_accounts_not_supported')
      return NextResponse.redirect(url)
    }

    // Staff/admin visiting root or /login while already authenticated ->
    // send them straight to their dashboard (your existing /staff route).
    if (isStaff && (path === '/' || path === '/login')) {
      const url = request.nextUrl.clone()
      url.pathname = '/staff'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}