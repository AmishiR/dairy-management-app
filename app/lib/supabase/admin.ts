import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// SERVER-ONLY. This uses the service_role key, which bypasses RLS entirely.
// This file must NEVER be imported from a 'use client' component or any
// code that ends up in the browser bundle — only from 'use server' action
// files. There is no cookie/session handling here on purpose; this client
// acts with full admin privileges regardless of who is browsing.
//
// Add to .env.local (server-only, NOT prefixed with NEXT_PUBLIC_):
//   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (server-only, no NEXT_PUBLIC_ prefix).'
    )
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}