# Supabase Migration Notes

This repo now uses Supabase for:

- Auth (email/password)
- Database (Postgres with RLS)
- Storage (public bucket for uploaded assets)
- Edge Functions (`submit-contact`, `admin-ai`, `admin-invite`, `github-activity`, `admin-search-console`)

## Required runtime values

Fill these in `portfolio/assets/js/runtime-config.js`:

- `supabase.url`
- `supabase.anonKey`
- `adminEmail` (optional frontend-only restriction)
- `siteUrl` (used for canonical URLs, social metadata, and sitemap alignment)
- `storageBucket` (defaults to `portfolio-assets`)

If you generate this file from environment variables, use:

- `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `SUPABASE_ANON_KEY`)
- `NEXT_PUBLIC_SITE_URL` (or `SITE_URL`)

## Database setup

1. Open your Supabase project.
2. Apply the migrations in `supabase/migrations/` in order:
   - `20260304170000_portfolio_init.sql`
   - `20260304182000_portfolio_seed.sql`
   - `20260309120000_security_refresh.sql`
   - `20260309193000_admin_history_assets_search_console.sql`
   - `20260310101500_remove_github_contributions.sql`
   - `20260310120000_restore_github_contributions.sql`
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

## Secrets for the Edge Functions

Set these secrets in Supabase:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (optional, defaults to `gemini-2.5-flash`)
- `GROQ_API_KEY` (optional fallback for `admin-ai`)
- `GROQ_MODEL` (optional, defaults to `llama-3.3-70b-versatile`)
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `SEARCH_CONSOLE_SERVICE_ACCOUNT_EMAIL` (optional, needed only for automatic Google sitemap submission)
- `SEARCH_CONSOLE_SERVICE_ACCOUNT_PRIVATE_KEY` (optional, same note as above)

Local example values are in `supabase/.env.example`.

If you use the Search Console submission helper, add that service-account email as an owner on the Search Console property first.

`admin-ai` uses Gemini first and automatically falls back to Groq when Gemini is unavailable or rate-limited, as long as `GROQ_API_KEY` is configured.

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

Deploy the functions:

```bash
supabase functions deploy submit-contact --no-verify-jwt
supabase functions deploy admin-ai --no-verify-jwt
supabase functions deploy admin-invite --no-verify-jwt
supabase functions deploy github-activity --no-verify-jwt
supabase functions deploy admin-search-console --no-verify-jwt
```

If you prefer the SQL editor instead of `supabase db push`, run both migration files manually in order, then deploy the function with the command above.

## Security model

- The browser only uses the Supabase anon key.
- All writes are protected by RLS and require an authenticated admin in `public.admin_users`.
- The contact form uses the public `submit-contact` Edge Function with honeypot validation and per-email rate limiting.
- `admin-ai` and `admin-invite` also require an authenticated admin, but they validate the bearer token inside the function instead of relying on gateway JWT verification.
- `github-activity` is a public, origin-restricted Edge Function that fetches GitHub contributions server-side and caches the markup in `public.github_activity_cache`.
- `admin-search-console` is an authenticated admin helper. It checks that your sitemap is reachable, and if you provide Search Console service-account credentials it also submits the sitemap through the official Search Console API.
- The service role key is used only inside the Edge Function, never in frontend code.
