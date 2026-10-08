create table public.posts (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title              text not null check (char_length(title) between 1 and 120),
  excerpt            text not null default '' check (char_length(excerpt) <= 240),
  category           text not null,              -- slug from BLOG_CATEGORIES (D-029)
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
