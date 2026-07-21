import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy apps/client/.env.example to apps/client/.env.local and fill in ' +
      'the values from your Supabase project settings.',
  )
}

/**
 * Single browser Supabase client for the whole app. The frontend owns the
 * entire auth lifecycle (sign up, sign in, session refresh, sign out) per
 * the system architecture - the API is a pure resource server that only
 * ever sees the resulting access token as a Bearer header.
 *
 * Session persistence uses the SDK's own storage (localStorage by default)
 * with automatic refresh-token rotation (`autoRefreshToken` + `persistSession`).
 * The api-client interceptor complements those timers: on 401 it runs a
 * single-flight `refreshSession` and retries the request before forcing logout.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
