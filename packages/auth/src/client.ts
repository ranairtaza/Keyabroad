import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@keyabroad/database'

/**
 * Creates a browser-side Supabase client.
 * Prefers modern NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY with temporary legacy fallback to NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createBrowserClient<Database>(supabaseUrl, publishableKey)
}
