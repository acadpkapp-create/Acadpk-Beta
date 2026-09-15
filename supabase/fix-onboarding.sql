-- ============================================================
-- Fixes the "new row violates row-level security policy" error
-- during onboarding. Creates the academy AND the owner's staff
-- row in one atomic, security-definer step, so there's no gap
-- where the user isn't staff of the academy they just created.
-- ============================================================

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
