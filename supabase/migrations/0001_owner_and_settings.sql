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
