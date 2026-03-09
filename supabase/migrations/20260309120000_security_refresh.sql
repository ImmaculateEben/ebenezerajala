alter table public.admin_users
  add column if not exists role text not null default 'admin',
  add column if not exists invited_by text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'admin_users_role_check'
      and conrelid = 'public.admin_users'::regclass
  ) then
    alter table public.admin_users
      add constraint admin_users_role_check
      check (role in ('viewer', 'editor', 'admin'));
  end if;
end $$;

update public.admin_users
set role = coalesce(nullif(trim(role), ''), 'admin')
where role is null or trim(role) = '';

create table if not exists public.contact_submission_limits (
  scope text not null check (scope in ('email', 'ip')),
  identifier text not null,
  last_submission_at timestamptz not null default timezone('utc', now()),
  primary key (scope, identifier)
);

alter table public.contact_submission_limits enable row level security;

drop policy if exists "No direct access to submission limits" on public.contact_submission_limits;
create policy "No direct access to submission limits"
on public.contact_submission_limits
for all
to anon, authenticated
using (false)
with check (false);

insert into public.contact_submission_limits (scope, identifier, last_submission_at)
select 'email', lower(email), last_submission_at
from public.contact_rate_limits
on conflict (scope, identifier) do update
set last_submission_at = excluded.last_submission_at;
