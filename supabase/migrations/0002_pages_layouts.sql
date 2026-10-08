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
