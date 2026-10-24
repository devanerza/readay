-- ============================================================
-- PROPOSAL ONLY — for Devan to review and run manually.
-- Per AGENTS.md ground rule #1: this agent does not execute
-- migrations against the live Supabase project.
--
-- Why: app code (book-detail.tsx, schedule-blocks.ts, queue-items.ts)
-- issues .update()/.delete() filtered only by row id. That is safe
-- ONLY IF row-level security binds every row to auth.uid().
--
-- Assumptions (reconcile with the real schema before running):
--   * Every user-owned table has a `user_id uuid` column
--   * profiles.user_id references auth.users(id)
--   * books is a shared read-cache of Open Library data,
--     upserted by any authenticated user (book-service.ts)
-- ============================================================

-- 1. Turn RLS on everywhere it's expected to exist
alter table public.profiles         enable row level security;
alter table public.queue_items      enable row level security;
alter table public.schedule_blocks  enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.weekly_insights  enable row level security;
alter table public.books            enable row level security;

-- 2. User-owned tables: full CRUD restricted to the row owner
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'queue_items', 'schedule_blocks',
    'reading_sessions', 'weekly_insights'
  ] loop
    if not exists (
      select 1 from pg_policies
      where tablename = t and policyname = t || '_owner_all'
    ) then
      execute format(
        'create policy %I on public.%I for all
           using (auth.uid() = user_id)
           with check (auth.uid() = user_id)',
        t || '_owner_all', t
      );
    end if;
  end loop;
end $$;

-- 3. books: shared cache — any authenticated user can read and
--    contribute rows, but cannot delete (book-service.ts upserts
--    by open_library_id; detail screen backfills page_count/author)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'books' and policyname = 'books_select_authenticated'
  ) then
    create policy books_select_authenticated on public.books
      for select to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'books' and policyname = 'books_upsert_authenticated'
  ) then
    create policy books_upsert_authenticated on public.books
      for insert to authenticated with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'books' and policyname = 'books_update_authenticated'
  ) then
    create policy books_update_authenticated on public.books
      for update to authenticated using (true);
  end if;
end $$;
-- Intentionally NO delete policy on books for clients;
-- deletes should be reserved for Devan/service_role.
