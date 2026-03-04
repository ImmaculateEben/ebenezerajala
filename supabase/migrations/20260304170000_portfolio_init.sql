create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  email text primary key check (position('@' in email) > 1),
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.admin_users is 'Insert the email addresses allowed to manage portfolio content.';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

create table if not exists public.site_content (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.projects (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.testimonials (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.messages (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contact_rate_limits (
  email text primary key,
  last_submission_at timestamptz not null default timezone('utc', now())
);

alter table public.admin_users enable row level security;
alter table public.site_content enable row level security;
alter table public.projects enable row level security;
alter table public.testimonials enable row level security;
alter table public.messages enable row level security;
alter table public.contact_rate_limits enable row level security;

drop policy if exists "Admins can read admin_users" on public.admin_users;
create policy "Admins can read admin_users"
on public.admin_users
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage admin_users" on public.admin_users;
create policy "Admins can manage admin_users"
on public.admin_users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
on public.site_content
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage site content" on public.site_content;
create policy "Admins can manage site content"
on public.site_content
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read projects" on public.projects;
create policy "Public can read projects"
on public.projects
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage projects" on public.projects;
create policy "Admins can manage projects"
on public.projects
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read testimonials" on public.testimonials;
create policy "Public can read testimonials"
on public.testimonials
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage testimonials" on public.testimonials;
create policy "Admins can manage testimonials"
on public.testimonials
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage messages" on public.messages;
create policy "Admins can manage messages"
on public.messages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "No direct access to rate limits" on public.contact_rate_limits;
create policy "No direct access to rate limits"
on public.contact_rate_limits
for all
to anon, authenticated
using (false)
with check (false);

insert into storage.buckets (id, name, public)
values ('portfolio-assets', 'portfolio-assets', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Public can view portfolio assets" on storage.objects;
create policy "Public can view portfolio assets"
on storage.objects
for select
to public
using (bucket_id = 'portfolio-assets');

drop policy if exists "Admins can upload portfolio assets" on storage.objects;
create policy "Admins can upload portfolio assets"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'portfolio-assets' and public.is_admin());

drop policy if exists "Admins can update portfolio assets" on storage.objects;
create policy "Admins can update portfolio assets"
on storage.objects
for update
to authenticated
using (bucket_id = 'portfolio-assets' and public.is_admin())
with check (bucket_id = 'portfolio-assets' and public.is_admin());

drop policy if exists "Admins can delete portfolio assets" on storage.objects;
create policy "Admins can delete portfolio assets"
on storage.objects
for delete
to authenticated
using (bucket_id = 'portfolio-assets' and public.is_admin());

insert into public.site_content (id, payload)
values (
  'main',
  jsonb_build_object(
    'profile', jsonb_build_object(),
    'techStacks', jsonb_build_array(),
    'skills', jsonb_build_object('technical', jsonb_build_array(), 'soft', jsonb_build_array()),
    'experience', jsonb_build_array(),
    'education', jsonb_build_array(),
    'settings', jsonb_build_object()
  )
)
on conflict (id) do nothing;

-- After running this migration, insert your real admin email:
-- insert into public.admin_users (email) values ('you@example.com') on conflict (email) do nothing;
