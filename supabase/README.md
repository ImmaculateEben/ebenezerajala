# Supabase Migration Notes

This repo now uses Supabase for:

- Auth (email/password)
- Database (Postgres with RLS)
- Storage (public bucket for uploaded assets)
- Edge Functions (`submit-contact`)

## Required runtime values

Fill these in `portfolio/assets/js/runtime-config.js`:

- `supabase.url`
- `supabase.anonKey`
- `adminEmail` (optional frontend-only restriction)
- `storageBucket` (defaults to `portfolio-assets`)

If you generate this file from environment variables, use:

- `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `SUPABASE_ANON_KEY`)

## Database setup

1. Open your Supabase project.
2. Apply the migrations in `supabase/migrations/` in order:
   - `20260304170000_portfolio_init.sql`
   - `20260304182000_portfolio_seed.sql`
3. The second migration seeds the default site content, projects, and testimonials automatically.
4. Insert your admin email into `public.admin_users`:

```sql
insert into public.admin_users (email)
values ('you@example.com')
on conflict (email) do nothing;
```

This email should match the admin account you create in Supabase Auth.

## Auth setup

1. In Supabase Dashboard, enable Email sign-in.
2. Create the admin user in Authentication.
3. Confirm the admin email exists in `public.admin_users`.

## Secrets for the Edge Function

Set these secrets in Supabase:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Local example values are in `supabase/.env.example`.

## Edge Function deployment

From the repo root, the normal CLI flow is:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

Set secrets before deploying the function:

```bash
supabase secrets set --env-file supabase/.env
```

Deploy the function as a public endpoint:

```bash
supabase functions deploy submit-contact --no-verify-jwt
```

If you prefer the SQL editor instead of `supabase db push`, run both migration files manually in order, then deploy the function with the command above.

## Security model

- The browser only uses the Supabase anon key.
- All writes are protected by RLS and require an authenticated admin in `public.admin_users`.
- The contact form uses the public `submit-contact` Edge Function with honeypot validation and per-email rate limiting.
- The service role key is used only inside the Edge Function, never in frontend code.
