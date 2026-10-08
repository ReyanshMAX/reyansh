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
