-- ============================================================
-- Landing page redesign: a real, live count of enrolled academies.
-- Security definer so it can read the academies table without
-- exposing it broadly — this only ever returns a number.
-- ============================================================

create or replace function get_public_stats()
returns json
language sql
security definer
stable
as $$
  select json_build_object(
    'academies_count', (select count(*) from academies)
  );
$$;

grant execute on function get_public_stats() to anon, authenticated;
