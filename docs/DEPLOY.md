# DEPLOY.md — env vars, Vercel + Supabase setup, cron, domain

## Overview

Production = one Vercel project (Hobby) connected to the GitHub repo, one
Supabase project (free tier). Every push to `main` deploys; PRs get preview
deploys that share the production Supabase project (single-owner site — no
staging DB). A daily Vercel cron keeps Supabase from pausing (D-018).

## Non-goals

- No staging Supabase project, no seed-data scripts beyond migrations.
- No Docker, no self-hosting.
- No CI test pipeline beyond Vercel's build (`next build` must pass; lint runs in build).

## Environment variables

| Name | Required | Read by | Value |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | all supabase clients | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | all supabase clients | project's anon / publishable key (either format works with supabase-js) |
| `NEXT_PUBLIC_SITE_URL` | yes | OAuth `redirectTo`, metadata `metadataBase`, sitemap | `http://localhost:3000` locally; production URL on Vercel |
| `CRON_SECRET` | yes (prod) | `api/cron/keepalive` | random 32+ chars; Vercel sends it as `Authorization: Bearer <CRON_SECRET>` |

There is intentionally no `SUPABASE_SERVICE_ROLE_KEY` (D-022). `.env.local` is gitignored; `.env.example` lists the four names with empty values.

## First-time setup (Phase 1)

1. In the repo root (which already holds these specs): `npx create-next-app@latest . --ts --tailwind --app --eslint --no-src-dir`. Routes stay in root `app/`; non-route code goes in `src/`. Set `tsconfig.json` `"paths": { "@/*": ["./src/*"] }` so imports read `@/lib/...`, `@/server/...`, `@/tiles/...`. Record the installed Next.js version in STATUS.md.
2. Create Supabase project (region `us-west-1` or nearest). Link: `npx supabase login && npx supabase link --project-ref <ref>`.
3. Apply migrations: `npx supabase db push`.
4. Supabase → Auth → Providers → GitHub: create a GitHub OAuth App (Homepage = site URL, Callback = `https://<ref>.supabase.co/auth/v1/callback`), paste client id/secret.
5. Supabase → Auth → URL Configuration: Site URL + redirect allowlist (docs/AUTH.md notes).
6. Push repo to GitHub → import into Vercel → set the env vars for Production + Preview.
7. Bootstrap owner (docs/AUTH.md).

## Cron — `vercel.json`

```json
{
  "framework": "nextjs",
  "crons": [{ "path": "/api/cron/keepalive", "schedule": "17 15 * * *" }]
}
```

```ts
// app/api/cron/keepalive/route.ts
export async function GET(req: Request): Promise<Response>
// 401 unless req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
// createPublicClient().from('site_settings').select('id').limit(1)
// 200 { ok: true, at: ISO } | 500 { ok: false, error }
```

## Domain

Launch on the `*.vercel.app` URL. Custom domain is Q-003; when decided: Vercel → Project → Domains → add, follow DNS records shown, then update `NEXT_PUBLIC_SITE_URL` and Supabase Site URL + GitHub OAuth homepage.

## SEO basics (Phase 5)

- `app/sitemap.ts` → `/`, `/about`, `/projects`, `/blog`, every published project and live post.
- `app/robots.ts` → allow all, disallow `/admin`, sitemap URL.
- Per-page `generateMetadata` with title + description (`one_liner` / `excerpt`). OG images: Q-005.

## Notes

- Vercel Hobby crons run once per day max and may fire anywhere within the scheduled hour — fine for keep-alive.
- Supabase free tier: 500 MB DB, 1 GB storage, 50 MB max file (bucket limit set to 10 MB in DATABASE.md).
- If the Supabase project does pause, public pages keep serving the last static render; only the dashboard and new revalidations fail. Unpause from the Supabase dashboard.
