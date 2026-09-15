-- ============================================================
-- FIX: infinite recursion in the "staff" table's own policy.
-- Safe to run even though your tables already exist —
-- this only touches the security policies, not your data.
-- ============================================================

-- Remove the broken policies
drop policy if exists "staff can view own academy" on academies;
drop policy if exists "staff can view own academy staff" on staff;
drop policy if exists "staff can manage own academy students" on students;
drop policy if exists "staff can manage own academy attendance" on attendance;
drop policy if exists "staff can manage own academy fees" on fees;

-- Helper function that safely looks up your academy without
-- re-triggering the same security check on itself
create or replace function get_my_academy_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select academy_id from staff where user_id = auth.uid();
$$;

-- Recreate the policies using the helper function instead
create policy "staff can view own academy"
  on academies for select
  using (id in (select get_my_academy_ids()));

create policy "staff can view own academy staff"
  on staff for select
  using (academy_id in (select get_my_academy_ids()));

create policy "staff can manage own academy students"
  on students for all
  using (academy_id in (select get_my_academy_ids()))
  with check (academy_id in (select get_my_academy_ids()));

create policy "staff can manage own academy attendance"
  on attendance for all
  using (academy_id in (select get_my_academy_ids()))
  with check (academy_id in (select get_my_academy_ids()));

create policy "staff can manage own academy fees"
  on fees for all
  using (academy_id in (select get_my_academy_ids()))
  with check (academy_id in (select get_my_academy_ids()));
