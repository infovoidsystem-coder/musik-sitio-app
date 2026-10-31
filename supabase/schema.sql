-- MUSIK: esquema inicial para alumnos, cursos, membresías, contenidos,
-- reservas y referencias de pago. Ejecutar una sola vez en Supabase SQL Editor.

create extension if not exists pgcrypto;

create type public.user_role as enum ('student', 'admin');
create type public.membership_status as enum ('pending', 'active', 'paused', 'cancelled', 'expired');
create type public.reservation_status as enum ('confirmed', 'cancelled', 'attended', 'no_show');
create type public.payment_status as enum ('pending', 'approved', 'rejected', 'refunded', 'cancelled');
create type public.content_type as enum ('class', 'video', 'material');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  artist_name text,
  avatar_url text,
  phone text,
  document_number text,
  birth_date date,
  address text,
  emergency_contact text,
  current_course text,
  membership_label text,
  account_status text not null default 'pendiente' check (account_status in ('activo','pendiente','pausado','finalizado')),
  admin_notes text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_ars numeric(12,2) not null check (price_ars >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.membership_plans(id),
  status public.membership_status not null default 'pending',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price_ars numeric(12,2) not null default 0 check (price_ars >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','active','completed','cancelled')),
  progress smallint not null default 0 check (progress between 0 and 100),
  enrolled_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_type text not null default 'class',
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  capacity integer not null check (capacity > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.reservation_status not null default 'confirmed',
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table public.club_content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  content_type public.content_type not null,
  duration_label text,
  content_url text,
  cover_url text,
  accent_color text not null default '#00eaf2',
  published boolean not null default false,
  required_plan_id uuid references public.membership_plans(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  membership_id uuid references public.memberships(id),
  enrollment_id uuid references public.enrollments(id),
  provider text not null,
  provider_payment_id text unique,
  amount_ars numeric(12,2) not null check (amount_ars >= 0),
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  constraint payment_target check (membership_id is not null or enrollment_id is not null)
);

create index memberships_user_idx on public.memberships(user_id);
create index reservations_event_idx on public.reservations(event_id);
create index reservations_user_idx on public.reservations(user_id);
create index payments_user_idx on public.payments(user_id);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles (id,email,full_name,avatar_url)
  values (new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name'),coalesce(new.raw_user_meta_data->>'avatar_url',new.raw_user_meta_data->>'picture'));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.membership_plans enable row level security;
alter table public.memberships enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.events enable row level security;
alter table public.reservations enable row level security;
alter table public.club_content enable row level security;
alter table public.payments enable row level security;

create policy "profile own read" on public.profiles for select to authenticated using (id=auth.uid() or public.is_admin());
create policy "profile own update" on public.profiles for update to authenticated using (id=auth.uid() or public.is_admin()) with check (id=auth.uid() or public.is_admin());
create policy "plans signed in read" on public.membership_plans for select to authenticated using (active or public.is_admin());
create policy "memberships own read" on public.memberships for select to authenticated using (user_id=auth.uid() or public.is_admin());
create policy "courses signed in read" on public.courses for select to authenticated using (active or public.is_admin());
create policy "enrollments own read" on public.enrollments for select to authenticated using (user_id=auth.uid() or public.is_admin());
create policy "events signed in read" on public.events for select to authenticated using (active or public.is_admin());
create policy "reservations own read" on public.reservations for select to authenticated using (user_id=auth.uid() or public.is_admin());
create policy "reservations own create" on public.reservations for insert to authenticated with check (user_id=auth.uid());
create policy "reservations own cancel" on public.reservations for update to authenticated using (user_id=auth.uid() or public.is_admin()) with check (user_id=auth.uid() or public.is_admin());
create policy "published content read" on public.club_content for select to authenticated using (published or public.is_admin());
create policy "payments own read" on public.payments for select to authenticated using (user_id=auth.uid() or public.is_admin());

create policy "admin profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin plans" on public.membership_plans for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin memberships" on public.memberships for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin courses" on public.courses for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin enrollments" on public.enrollments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin events" on public.events for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin reservations" on public.reservations for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin content" on public.club_content for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Crear el primer administrador después de ingresar una vez con Google:
-- update public.profiles set role='admin' where email='TU_EMAIL@gmail.com';

-- Tracks enviados por alumnos para Musik Radio
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

-- Mensajes y contenidos enviados a un miembro o a toda la comunidad
create table if not exists public.member_deliveries (
  id uuid primary key default gen_random_uuid(),
  recipient_email text,
  kind text not null check (kind in ('message','content')),
  title text not null,
  body text not null,
  url text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.member_deliveries enable row level security;
create policy "members read deliveries" on public.member_deliveries for select to authenticated
using (recipient_email is null or lower(recipient_email)=lower((select email from public.profiles where id=auth.uid())) or public.is_admin());
create policy "admin manages deliveries" on public.member_deliveries for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Biblioteca pública en catálogo, con archivos privados para miembros
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
insert into storage.buckets (id,name,public,file_size_limit) values ('member-downloads','member-downloads',false,52428800)
on conflict (id) do update set public=false,file_size_limit=52428800;
create policy "members download private files" on storage.objects for select to authenticated using (bucket_id='member-downloads');
create policy "admin uploads download files" on storage.objects for insert to authenticated with check (bucket_id='member-downloads' and public.is_admin());
create policy "admin deletes download files" on storage.objects for delete to authenticated using (bucket_id='member-downloads' and public.is_admin());

