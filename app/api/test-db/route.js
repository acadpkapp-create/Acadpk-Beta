import { createClient } from '@supabase/supabase-js';

// A quick connectivity check for Day 2 — not part of the real app.
// Hitting this URL should return { connected: true, academies: [] }
// (empty array is correct: row-level security means an anonymous
// request can't see any academies yet, but the query itself should
// succeed with no error — that's what proves the connection works.)
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.from('academies').select('*');

    if (error) {
      return Response.json({ connected: false, error: error.message }, { status: 500 });
    }

    return Response.json({ connected: true, academies: data });
  } catch (err) {
    return Response.json({ connected: false, error: err.message }, { status: 500 });
  }
}
