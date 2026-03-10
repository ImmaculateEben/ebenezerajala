-- Restore GitHub contributions feature
-- Recreates the activity cache table and re-adds the two settings fields
-- that were removed by 20260310101500_remove_github_contributions.sql

/* ── github_activity_cache ──────────────────────────────────────── */
create table if not exists public.github_activity_cache (
  username    text        primary key,
  markup      text        not null,
  fetched_at  timestamptz not null default timezone('utc', now()),
  expires_at  timestamptz not null,
  source_url  text        not null default '',
  metadata    jsonb       not null default '{}'::jsonb
);

create index if not exists github_activity_cache_expires_at_idx
  on public.github_activity_cache (expires_at);

alter table public.github_activity_cache enable row level security;

-- Block all direct client access; the Edge Function uses the service-role key
drop policy if exists "No direct client access to GitHub activity cache"
  on public.github_activity_cache;

create policy "No direct client access to GitHub activity cache"
  on public.github_activity_cache
  for all
  to anon, authenticated
  using (false)
  with check (false);

/* ── Restore profile.githubUsername ────────────────────────────── */
update public.site_content
set payload = jsonb_set(
  payload,
  '{profile,githubUsername}',
  coalesce(
    payload #> '{profile,githubUsername}',
    '"ImmaculateEben"'::jsonb
  ),
  true
)
where id = 'main'
  and not (payload -> 'profile' ? 'githubUsername');

/* ── Restore settings.githubChartScrollPosition ─────────────────── */
update public.site_content
set payload = jsonb_set(
  payload,
  '{settings,githubChartScrollPosition}',
  coalesce(
    payload #> '{settings,githubChartScrollPosition}',
    '"right"'::jsonb
  ),
  true
)
where id = 'main'
  and not (payload -> 'settings' ? 'githubChartScrollPosition');
