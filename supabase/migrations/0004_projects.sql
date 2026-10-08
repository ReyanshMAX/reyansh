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
