create table if not exists public.member_downloads (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('tip','track','material')),
  title text not null,
  description text not null,
  file_path text,
  file_name text,
  external_url text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.member_downloads enable row level security;
create policy "public reads download catalog" on public.member_downloads for select to anon,authenticated using (enabled or public.is_admin());
create policy "admin manages downloads" on public.member_downloads for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id,name,public,file_size_limit)
values ('member-downloads','member-downloads',false,52428800)
on conflict (id) do update set public=false,file_size_limit=52428800;

create policy "members download private files" on storage.objects for select to authenticated using (bucket_id='member-downloads');
create policy "admin uploads download files" on storage.objects for insert to authenticated with check (bucket_id='member-downloads' and public.is_admin());
create policy "admin deletes download files" on storage.objects for delete to authenticated using (bucket_id='member-downloads' and public.is_admin());
