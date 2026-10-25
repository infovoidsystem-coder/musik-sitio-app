create table if not exists public.track_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text,
  artist_name text not null,
  title text not null,
  genre text,
  audio_url text not null,
  message text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.track_submissions enable row level security;
create policy "approved tracks public read" on public.track_submissions for select to anon using (status='approved');
create policy "members read own tracks" on public.track_submissions for select to authenticated using (user_id=auth.uid() or public.is_admin());
create policy "members submit own tracks" on public.track_submissions for insert to authenticated with check (user_id=auth.uid() and status='pending');
create policy "admin reviews tracks" on public.track_submissions for update to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('track-audio','track-audio',true,52428800,array['audio/mpeg','audio/wav','audio/mp4','audio/x-m4a'])
on conflict (id) do update set public=true,file_size_limit=52428800,allowed_mime_types=excluded.allowed_mime_types;

create policy "members upload own track audio" on storage.objects for insert to authenticated
with check (bucket_id='track-audio' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "public reads track audio" on storage.objects for select to public using (bucket_id='track-audio');
create policy "members remove own pending audio" on storage.objects for delete to authenticated
using (bucket_id='track-audio' and (storage.foldername(name))[1]=auth.uid()::text);
