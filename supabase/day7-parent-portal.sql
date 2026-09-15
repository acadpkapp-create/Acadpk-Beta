-- ============================================================
-- Day 7: Parent portal
-- Each student gets a random, unguessable token used in their
-- parent link — separate from the student's internal database ID,
-- so knowing one doesn't help you guess another.
-- ============================================================

alter table students add column share_token uuid not null default gen_random_uuid();

-- Public-facing function: given a valid token, returns just that
-- one student's basic info, recent attendance, and fee history —
-- nothing else. Security definer so it can safely read across the
-- normal RLS rules, but it only ever returns the single matching
-- student, never a list.
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

-- Parents aren't logged in, so the anon role needs permission to call this
grant execute on function get_parent_view(uuid) to anon, authenticated;
