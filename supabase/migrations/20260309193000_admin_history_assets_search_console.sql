create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null default '',
  action text not null,
  entity_type text not null,
  entity_id text not null,
  section text not null default '',
  summary text not null default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.content_versions (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  entity_type text not null,
  entity_id text not null,
  snapshot_type text not null default 'auto',
  label text not null default '',
  summary text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_by text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'content_versions_snapshot_type_check'
      and conrelid = 'public.content_versions'::regclass
  ) then
    alter table public.content_versions
      add constraint content_versions_snapshot_type_check
      check (snapshot_type in ('auto', 'draft', 'restore'));
  end if;
end $$;

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);

create index if not exists admin_audit_log_entity_idx
  on public.admin_audit_log (entity_type, entity_id, created_at desc);

create index if not exists content_versions_lookup_idx
  on public.content_versions (section, entity_type, entity_id, created_at desc);

alter table public.admin_audit_log enable row level security;
alter table public.content_versions enable row level security;

drop policy if exists "Admins can read admin audit log" on public.admin_audit_log;
create policy "Admins can read admin audit log"
on public.admin_audit_log
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert admin audit log" on public.admin_audit_log;
create policy "Admins can insert admin audit log"
on public.admin_audit_log
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can read content versions" on public.content_versions;
create policy "Admins can read content versions"
on public.content_versions
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert content versions" on public.content_versions;
create policy "Admins can insert content versions"
on public.content_versions
for insert
to authenticated
with check (public.is_admin());

update public.site_content
set payload = jsonb_set(
  payload,
  '{settings,searchConsole}',
  coalesce(payload #> '{settings,searchConsole}', '{}'::jsonb) || jsonb_build_object(
    'verificationTags', '',
    'sitemapUrl', '',
    'lastPingAt', '',
    'lastPingStatus', '',
    'lastPingMessage', '',
    'indexingNotes', ''
  ),
  true
)
where id = 'main';
