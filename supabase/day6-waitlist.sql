-- ============================================================
-- Day 6: waitlist table for the landing page.
-- Separate from real academy signups — pilot interest only,
-- since real accounts wait until the Day 10 security review.
-- ============================================================

create table waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  academy_name text,
  city text,
  created_at timestamptz not null default now()
);

alter table waitlist enable row level security;

-- Anyone can join the waitlist (it's a public landing page form)
create policy "anyone can join waitlist"
  on waitlist for insert
  with check (true);

-- No SELECT policy on purpose — only you (viewing directly in the
-- Supabase dashboard, which bypasses RLS) can read the list.
-- Visitors can add themselves but can't see who else signed up.
