-- ============================================================
-- Academy Manager — Day 2 schema
-- Run this entire file once in Supabase: SQL Editor > New query > paste > Run
-- ============================================================

-- 1. ACADEMIES: one row per tuition center / academy (a "tenant")
create table academies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 2. STAFF: links a logged-in user to the academy they belong to.
-- This is the table every other table's security rule checks against.
create table staff (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner', -- 'owner' or 'tutor', more roles later
  created_at timestamptz not null default now(),
  unique (academy_id, user_id)
);

-- 3. STUDENTS
create table students (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  name text not null,
  parent_name text,
  parent_phone text,
  class_or_subject text,
  monthly_fee numeric(10,2) default 0,
  share_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- 4. ATTENDANCE
create table attendance (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  attendance_date date not null default current_date,
  status text not null check (status in ('present', 'absent', 'leave')),
  created_at timestamptz not null default now(),
  unique (student_id, attendance_date)
);

-- 5. FEES
create table fees (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  fee_month text not null, -- e.g. '2026-08'
  amount numeric(10,2) not null,
  status text not null default 'due' check (status in ('due', 'paid')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (student_id, fee_month)
);

-- ============================================================
-- ROW-LEVEL SECURITY — this is the part that prevents one academy
-- from ever seeing another academy's data, at the database level.
-- ============================================================

alter table academies enable row level security;
alter table staff enable row level security;
alter table students enable row level security;
alter table attendance enable row level security;
alter table fees enable row level security;

-- Helper function: looks up which academy/academies the current
-- logged-in user belongs to. Marked SECURITY DEFINER so it bypasses
-- row-level security when it queries staff internally — this is
-- what avoids the infinite-recursion trap of a policy on "staff"
-- querying "staff" again to check itself.
create or replace function get_my_academy_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select academy_id from staff where user_id = auth.uid();
$$;

-- Staff can see/manage their own academy's row
create policy "staff can view own academy"
  on academies for select
  using (id in (select get_my_academy_ids()));

-- Staff can see other staff rows only within their own academy
create policy "staff can view own academy staff"
  on staff for select
  using (academy_id in (select get_my_academy_ids()));

create policy "users can insert their own staff row"
  on staff for insert
  with check (user_id = auth.uid());

-- Students: full access, but only within your own academy
create policy "staff can manage own academy students"
  on students for all
  using (academy_id in (select get_my_academy_ids()))
  with check (academy_id in (select get_my_academy_ids()));

-- Attendance: same pattern
create policy "staff can manage own academy attendance"
  on attendance for all
  using (academy_id in (select get_my_academy_ids()))
  with check (academy_id in (select get_my_academy_ids()));

-- Fees: same pattern
create policy "staff can manage own academy fees"
  on fees for all
  using (academy_id in (select get_my_academy_ids()))
  with check (academy_id in (select get_my_academy_ids()));

-- Anyone (even logged out) can create a new academy — this is what
-- happens during signup on Day 3, before they have a staff row yet.
create policy "anyone can create an academy"
  on academies for insert
  with check (true);

-- Onboarding: creates the academy AND links the creator as owner
-- staff in one atomic step, avoiding a gap where the user briefly
-- isn't staff of the academy they just created (which would trip
-- the SELECT policy above when the client asks for the row back).
create or replace function create_academy_with_owner(academy_name text)
returns uuid
language plpgsql
security definer
as $$
declare
  new_academy_id uuid;
begin
  insert into academies (name) values (academy_name)
  returning id into new_academy_id;

  insert into staff (academy_id, user_id, role)
  values (new_academy_id, auth.uid(), 'owner');

  return new_academy_id;
end;
$$;

grant execute on function create_academy_with_owner(text) to authenticated;

-- ============================================================
-- WAITLIST — for the public landing page (Day 6), separate from
-- real academy signups.
-- ============================================================

create table waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  academy_name text,
  city text,
  created_at timestamptz not null default now()
);

alter table waitlist enable row level security;

create policy "anyone can join waitlist"
  on waitlist for insert
  with check (true);

-- ============================================================
-- PARENT PORTAL (Day 7) — public read-only view via a token,
-- no login required for parents.
-- ============================================================

create or replace function get_parent_view(p_token uuid)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_build_object(
    'student', json_build_object(
      'name', s.name,
      'class_or_subject', s.class_or_subject,
      'academy_name', a.name
    ),
    'attendance', (
      select coalesce(json_agg(row_to_json(att)), '[]'::json)
      from (
        select attendance_date, status
        from attendance
        where student_id = s.id
        order by attendance_date desc
        limit 30
      ) att
    ),
    'fees', (
      select coalesce(json_agg(row_to_json(f)), '[]'::json)
      from (
        select fee_month, amount, status
        from fees
        where student_id = s.id
        order by fee_month desc
        limit 12
      ) f
    )
  )
  into result
  from students s
  join academies a on a.id = s.academy_id
  where s.share_token = p_token;

  return result;
end;
$$;

grant execute on function get_parent_view(uuid) to anon, authenticated;
