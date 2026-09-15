import { createBrowserClient } from '@supabase/ssr';

// Reads your Supabase project URL and anon key from .env.local
// (see .env.local.example — you'll fill this in on Day 2)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
