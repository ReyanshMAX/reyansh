# AUTH.md — sign-in, owner allowlist, protected routes

## Overview

The dashboard is protected by Supabase Auth with GitHub as the only provider
(D-006). Any GitHub user can technically complete OAuth, but only the user id
in `app_owner` passes the proxy gate and RLS (`is_owner()`). Public pages
never touch auth.

## Non-goals

- No magic link, password, or second provider (wireframe DB 1's email form is dropped).
- No sign-up page, no account settings, no session list.
- No role system beyond "owner or not".

## Flow

1. `/admin/login` shows one button "Continue with GitHub" (ink pill, per wireframe DB 1, without the email form).
2. Client calls:
   ```ts
   supabase.auth.signInWithOAuth({
     provider: 'github',
     options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/admin` },
   });
   ```
3. `app/auth/callback/route.ts`:
   ```ts
   export async function GET(req: NextRequest): Promise<NextResponse>
   // read ?code & ?next; supabase.auth.exchangeCodeForSession(code);
   // on error → redirect('/admin/login?error=oauth'); else redirect(next ?? '/admin')
   ```
4. `proxy.ts` — Next 16's rename of `middleware.ts`, exported function `proxy` (matcher `['/admin/:path*']`, excluding `/admin/login`):
   - Refresh session via `@supabase/ssr` `createServerClient` with request/response cookies.
   - No user → redirect `/admin/login`.
   - User present: `select user_id from app_owner where user_id = auth.uid()`; no row → `supabase.auth.signOut()` then redirect `/admin/login?error=not_owner`.
5. `src/server/auth.ts`:
   ```ts
   export async function requireOwner(): Promise<{ userId: string }>;  // re-checks inside every server action; throws ActionError('unauthorized') caught by the action wrapper
   export async function signOut(): Promise<void>;                      // server action, redirects to /admin/login
   ```

Login page error messages:
| `?error=` | Message |
|---|---|
| `oauth` | "GitHub sign-in failed. Try again." |
| `not_owner` | "This dashboard is private." |

## Owner bootstrap (one time)

1. Deploy Phase 1, open `/admin/login`, sign in with GitHub. You'll be bounced with "This dashboard is private." — expected.
2. Supabase dashboard → Authentication → Users → copy your user UUID.
3. SQL editor: `insert into public.app_owner (user_id) values ('<uuid>');`
4. Sign in again → lands on `/admin/layout/home`.

## Notes

- GitHub OAuth app: Supabase dashboard → Authentication → Providers → GitHub; callback URL is the Supabase one (`https://<project>.supabase.co/auth/v1/callback`), not the site's.
- Supabase Auth → URL Configuration: Site URL = production URL; add `http://localhost:3000/**` and `https://*-<team>.vercel.app/**` to redirect allowlist for local + preview deploys.
- Never expose `is_owner()` results to the client beyond rendering the dashboard.
