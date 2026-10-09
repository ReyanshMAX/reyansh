# Open Questions

Unresolved. Do not resolve these silently — ask, then move the answer to
DECISIONS.md and delete the entry here.

## Q-002: Real site content

- **Blocking:** no — needed before Phase 5 launch checklist.
- **Options:** Owner supplies: hero tagline, About bio, timeline entries (contests, hackathons, science fair, school), project write-ups (Anchor, Atlas, sonar ring, Pi assistant, others), photo, email/GitHub/LinkedIn, résumé PDF.
- **Depends on it:** nothing in code. Every `[PLACEHOLDER]` in wireframes stays a placeholder until supplied. Never invent bios, results, dates or stats.

## Q-003: Custom domain

- **Blocking:** no — launch on `*.vercel.app`.
- **Options:** Claim via GitHub Student Developer Pack partner (free first year) vs buy directly. Name undecided.
- **Depends on it:** `NEXT_PUBLIC_SITE_URL`, Supabase Site URL, GitHub OAuth app homepage (docs/DEPLOY.md).
