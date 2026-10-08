# DATABASE.md — Supabase schema, RLS, storage, migrations

## Overview

All persistent state lives in one Supabase project: Postgres tables for pages,
layouts, projects, posts, media metadata and site settings; one public Storage
bucket for uploaded files. Row Level Security is the only write guard — the app
never uses the service-role key (D-022). Anonymous visitors can read only
published rows; the single owner (row in `app_owner`) can do everything.

## Non-goals

- No multi-user roles, no per-row ownership columns.
- No soft deletes, no audit/history tables (undo lives in the editor's memory only).
- No full-text search indexes.
- No database-side tile validation — tile JSON shape is enforced by zod in `src/lib/schemas.ts`.
- No `views` / analytics columns (D-014).

## Migrations (apply in order)

```
supabase/migrations/
  0001_owner_and_settings.sql
  0002_pages_layouts.sql
  0003_media_and_storage.sql
  0004_projects.sql
  0005_posts.sql
```

Phase 1 needs 0001–0002. Later phases add the rest (see BUILD.md).

### 0001_owner_and_settings.sql

```sql
create extension if not exists pgcrypto;

-- exactly one owner; inserted manually after first sign-in (docs/AUTH.md)
create table public.app_owner (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.app_owner where user_id = auth.uid());
$$;

create table public.site_settings (
  id            int primary key default 1 check (id = 1),
  now_text      text not null default '',
  email         text not null default '',
  github_url    text not null default '',
  linkedin_url  text not null default '',
  resume_path   text,            -- storage path in bucket 'media', e.g. 'files/resume.pdf'
  updated_at    timestamptz not null default now()
);
insert into public.site_settings (id) values (1);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

alter table public.app_owner     enable row level security;
alter table public.site_settings enable row level security;

create policy "owner reads own row"   on public.app_owner     for select using (user_id = auth.uid());
create policy "public read settings"  on public.site_settings for select using (true);
create policy "owner updates settings" on public.site_settings for update using (public.is_owner()) with check (public.is_owner());
```

### 0002_pages_layouts.sql

```sql
create table public.pages (
  slug   text primary key check (slug in ('home', 'about')),
  title  text not null
);
insert into public.pages (slug, title) values ('home', 'Home'), ('about', 'About');

create table public.layouts (
  id            uuid primary key default gen_random_uuid(),
  page_slug     text not null references public.pages(slug) on delete cascade,
  status        text not null check (status in ('draft', 'published')),
  tiles         jsonb not null default '[]'::jsonb,   -- Tile[] (docs/TILES.md), validated by zod
  updated_at    timestamptz not null default now(),
  published_at  timestamptz,
  unique (page_slug, status)
);

insert into public.layouts (page_slug, status)
select slug, s from public.pages cross join (values ('draft'), ('published')) v(s);

create trigger layouts_touch before update on public.layouts
  for each row execute function public.touch_updated_at();

alter table public.pages   enable row level security;
alter table public.layouts enable row level security;

create policy "public read pages"            on public.pages   for select using (true);
create policy "public read published layout" on public.layouts for select using (status = 'published' or public.is_owner());
create policy "owner updates layouts"        on public.layouts for update using (public.is_owner()) with check (public.is_owner());
```

Rows are pre-created; the app only ever `update`s layouts, never inserts/deletes.

### 0003_media_and_storage.sql

```sql
create table public.media (
  id          uuid primary key default gen_random_uuid(),
  path        text not null unique,          -- object key in bucket 'media', e.g. 'img/2026/10/<uuid>.webp'
  kind        text not null check (kind in ('image', 'file')),
  alt         text not null default '',
  width       int,
  height      int,
  bytes       int not null,
  created_at  timestamptz not null default now()
);

alter table public.media enable row level security;
create policy "public read media"  on public.media for select using (true);
create policy "owner writes media" on public.media for all using (public.is_owner()) with check (public.is_owner());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760,  -- 10 MB
        array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','application/pdf']);

create policy "owner uploads media" on storage.objects for insert
  with check (bucket_id = 'media' and public.is_owner());
create policy "owner updates media" on storage.objects for update
  using (bucket_id = 'media' and public.is_owner());
create policy "owner deletes media" on storage.objects for delete
  using (bucket_id = 'media' and public.is_owner());
create policy "owner reads media objects" on storage.objects for select
  using (bucket_id = 'media' and public.is_owner());   -- storage remove() needs select as well as delete
-- reads: bucket is public, served via /storage/v1/object/public/media/<path>
```

### 0004_projects.sql

```sql
create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title         text not null check (char_length(title) between 1 and 80),
  one_liner     text not null default '' check (char_length(one_liner) <= 140),
  category      text not null,                 -- slug from PROJECT_CATEGORIES (D-026)
  year          int check (year between 2015 and 2100),
  role          text not null default '',
  stack         text[] not null default '{}',
  status        text not null default 'in_progress'
                  check (status in ('in_progress', 'shipped', 'archived')),
  github_url    text,
  demo_url      text,
  cover_media_id uuid references public.media(id) on delete set null,
  video_url     text,                          -- YouTube/Vimeo watch URL, embedded on the detail page (D-027)
  body_md       text not null default '',
  featured      boolean not null default false,
  sort_order    int not null default 0,
  published     boolean not null default false,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index projects_public_order on public.projects (published, sort_order);

create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

alter table public.projects enable row level security;
create policy "public read published projects" on public.projects for select using (published or public.is_owner());
create policy "owner writes projects"          on public.projects for all using (public.is_owner()) with check (public.is_owner());
```

### 0005_posts.sql

```sql
create table public.posts (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title              text not null check (char_length(title) between 1 and 120),
  excerpt            text not null default '' check (char_length(excerpt) <= 240),
  category           text not null,              -- value from BLOG_CATEGORIES (Q-001)
  related_project_id uuid references public.projects(id) on delete set null,
  cover_media_id     uuid references public.media(id) on delete set null,
  body_md            text not null default '',
  show_in_feed       boolean not null default true,
  published_at       timestamptz,                -- null = draft; future = scheduled
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index posts_public_order on public.posts (published_at desc) where published_at is not null;

create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

alter table public.posts enable row level security;
create policy "public read live posts" on public.posts for select
  using ((published_at is not null and published_at <= now()) or public.is_owner());
create policy "owner writes posts" on public.posts for all using (public.is_owner()) with check (public.is_owner());
```

## Types (generated)

After each migration: `npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts`.
Never hand-edit that file.

## Notes

- Read time for posts is computed at render: `Math.max(1, Math.round(words / 220))` min. Not stored.
- Deleting a `media` row must also delete the storage object, and is refused if the id appears in any `layouts.tiles` (check: `tiles::text like '%' || id || '%'`), or if its path is `site_settings.resume_path` (D-025) — see docs/DASHBOARD.md.
- `published_at` on projects is set the first time `published` flips true and never cleared.
- Scheduled posts become visible to RLS at `published_at`, but static pages show them only after the next revalidation (≤ 1 hour, D-017).
