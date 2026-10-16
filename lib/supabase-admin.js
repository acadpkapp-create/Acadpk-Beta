import { createClient } from '@supabase/supabase-js';

// SERVER-ONLY. This uses the Supabase service role key, which
// bypasses Row Level Security entirely and can do things the
// anon/browser client can't (like deleting an auth user).
//
// NEVER import this file from a 'use client' component or from
// anything that runs in the browser. NEVER prefix the env var
// with NEXT_PUBLIC_ — that would ship the secret key to every
// visitor's browser. Only import this inside app/api/**/route.js
// files (Route Handlers), which always run on the server.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
