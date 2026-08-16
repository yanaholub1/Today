-- "Today" app — real schema + RLS (Stage 6 migration off mock data).
--
-- This file is a reference copy of the migration actually applied to the
-- live project (via the Supabase MCP server's `apply_migration`, tracked
-- as migration `initial_schema_with_rls`) — if you're setting up a NEW
-- project from scratch without MCP access, paste this into that project's
-- SQL Editor (Dashboard → SQL Editor → New query → paste → Run) instead.
--
-- Auth itself uses Supabase's built-in `auth.users` — no custom users/
-- profiles table needed yet (Profile screen is still a placeholder;
-- nothing beyond auth.uid() is required by any table below).

-- ─────────────────────────────────────────────────────────────────────────
-- day_logs — one row per user per calendar day. `energy` uses 'low'/'medium'/
-- 'high' (not the brief's literal 'Low/Steady/High') to match the already-
-- built, verified UI copy ("Low"/"Medium"/"High" everywhere it's shown).
-- ─────────────────────────────────────────────────────────────────────────
create table day_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  energy text check (energy in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ─────────────────────────────────────────────────────────────────────────
-- intentions — up to 3 per day_log (position 1-3, not the brief's original
-- 1-2 cap — matches the app's already-shipped MAX_INTENTIONS_PER_DAY=3).
-- No direct user_id column (matches the brief's exact column list); RLS
-- reaches user_id via the day_logs FK instead (see policies below).
-- ─────────────────────────────────────────────────────────────────────────
create table intentions (
  id uuid primary key default gen_random_uuid(),
  day_log_id uuid not null references day_logs(id) on delete cascade,
  text text not null,
  sphere text not null check (
    sphere in ('health', 'finances', 'romance', 'funHobbies', 'homeEnvironment', 'family', 'personalGrowth', 'work')
  ),
  position smallint not null check (position between 1 and 3),
  glad boolean, -- null until the evening reflection is answered
  tag text, -- a single ReflectionTagPair id (lib/reflectionTags.ts) — one tag, not an array (multi-select was tried and reverted)
  note text,
  reflected_at timestamptz, -- null until the evening reflection is saved
  unique (day_log_id, position)
);

-- ─────────────────────────────────────────────────────────────────────────
-- mood_checkins — no day_log_id FK (matches the brief exactly): a check-in
-- is grouped into a "day" purely by created_at's date, same as the app's
-- existing aggregation logic (journalHistory.ts / patternsAggregation.ts).
-- ─────────────────────────────────────────────────────────────────────────
create table mood_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  emotion text not null,
  quadrant text not null check (
    quadrant in ('high-unpleasant', 'high-pleasant', 'low-unpleasant', 'low-pleasant')
  ),
  intensity smallint not null check (intensity between 1 and 5),
  technique text, -- a TechniqueDef id (lib/moodTechniques.ts), or null if no technique was tried
  better boolean, -- null unless the "Do you feel better?" sheet was answered
  liked boolean, -- null unless a technique was tried
  note text
);

-- ─────────────────────────────────────────────────────────────────────────
-- favorite_techniques — a plain join table (user_id, technique_id), not an
-- array column on a profiles table: there's no other reason for a profiles
-- table to exist yet, and a join table makes "toggle favorite" a plain
-- insert/delete instead of a read-modify-write race on an array column.
-- ─────────────────────────────────────────────────────────────────────────
create table favorite_techniques (
  user_id uuid not null references auth.users(id) on delete cascade,
  technique_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, technique_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Indexes for RLS lookups. day_logs' own unique(user_id, date) and
-- intentions' own unique(day_log_id, position) already index user_id /
-- day_log_id as their leading column, so both are covered for free.
-- favorite_techniques' primary key (user_id, technique_id) is the same
-- story. mood_checkins has no existing constraint covering user_id, so it
-- gets an explicit index — without it, every RLS-filtered query against
-- this table (i.e. every query the app ever makes against it) would seq-scan.
-- ─────────────────────────────────────────────────────────────────────────
create index mood_checkins_user_id_idx on mood_checkins using btree (user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security — every table scoped to auth.uid(). This is the real
-- security boundary: the anon/publishable key ships in the client bundle,
-- so without these policies any authenticated user could read/write any
-- other user's rows through direct table access, regardless of what the
-- UI shows.
--
-- Follows current Supabase RLS best practices (verified against Supabase's
-- own docs at implementation time, not assumed):
--   - `(select auth.uid())` instead of a bare `auth.uid()` call, so Postgres
--     caches it once per query (initPlan) instead of re-evaluating it for
--     every row — a well-documented, large performance difference at scale
--     (Supabase's own benchmarks show ~95-99% latency reduction).
--   - `to authenticated` on every policy, so it's skipped entirely for the
--     `anon` role rather than evaluated and failing.
--   - Explicit `auth.uid() is not null` guard on the direct-user_id tables,
--     so intent is explicit rather than relying on `null = user_id` being
--     implicitly false.
--   - Separate SELECT/INSERT/UPDATE/DELETE policies per table rather than
--     one blanket `for all`, so each operation's own condition is legible
--     and independently auditable.
-- ─────────────────────────────────────────────────────────────────────────
alter table day_logs enable row level security;
alter table intentions enable row level security;
alter table mood_checkins enable row level security;
alter table favorite_techniques enable row level security;

-- day_logs
create policy "day_logs_select_own" on day_logs for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "day_logs_insert_own" on day_logs for insert to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "day_logs_update_own" on day_logs for update to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "day_logs_delete_own" on day_logs for delete to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- mood_checkins
create policy "mood_checkins_select_own" on mood_checkins for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "mood_checkins_insert_own" on mood_checkins for insert to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "mood_checkins_update_own" on mood_checkins for update to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "mood_checkins_delete_own" on mood_checkins for delete to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- favorite_techniques
create policy "favorite_techniques_select_own" on favorite_techniques for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "favorite_techniques_insert_own" on favorite_techniques for insert to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "favorite_techniques_update_own" on favorite_techniques for update to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "favorite_techniques_delete_own" on favorite_techniques for delete to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- intentions — no direct user_id column (matches the app's brief exactly),
-- so ownership is checked by joining to day_logs. The EXISTS subquery hits
-- day_logs' own primary-key/unique indexes, so this stays cheap.
create policy "intentions_select_own" on intentions for select to authenticated
  using (exists (
    select 1 from day_logs
    where day_logs.id = intentions.day_log_id
      and day_logs.user_id = (select auth.uid())
  ));
create policy "intentions_insert_own" on intentions for insert to authenticated
  with check (exists (
    select 1 from day_logs
    where day_logs.id = intentions.day_log_id
      and day_logs.user_id = (select auth.uid())
  ));
create policy "intentions_update_own" on intentions for update to authenticated
  using (exists (
    select 1 from day_logs
    where day_logs.id = intentions.day_log_id
      and day_logs.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from day_logs
    where day_logs.id = intentions.day_log_id
      and day_logs.user_id = (select auth.uid())
  ));
create policy "intentions_delete_own" on intentions for delete to authenticated
  using (exists (
    select 1 from day_logs
    where day_logs.id = intentions.day_log_id
      and day_logs.user_id = (select auth.uid())
  ));
