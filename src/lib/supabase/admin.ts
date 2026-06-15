import { createClient } from '@supabase/supabase-js'

// A privileged Supabase client that bypasses Row Level Security. Use this ONLY
// in trusted server code (API routes) — never in the browser. We need it so the
// cancel route can read OTHER customers' waitlist rows in order to notify them.
//
// Requires SUPABASE_SERVICE_ROLE_KEY (Supabase dashboard → Settings → API).
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
