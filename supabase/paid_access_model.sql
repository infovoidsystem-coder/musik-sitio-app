-- MUSIK: acceso pago, permanencia de cursos y vigencia temporal del Club.
-- Ejecutar despues de schema.sql en Supabase SQL Editor.

alter table public.courses add column if not exists starts_at timestamptz;
alter table public.courses add column if not exists ends_at timestamptz;

alter table public.club_content
  add column if not exists access_scope text not null default 'club'
  check (access_scope in ('club','course'));
alter table public.club_content
  add column if not exists course_id uuid references public.courses(id) on delete cascade;

create or replace function public.has_paid_course_access(target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public
as $$
  select exists (
    select 1 from public.enrollments e
    join public.payments p on p.enrollment_id=e.id
    where e.user_id=target_user
      and e.status in ('active','completed')
      and p.status='approved'
  )
$$;

create or replace function public.has_active_club_access(target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public
as $$
  select exists (
    select 1 from public.memberships m
    join public.payments p on p.membership_id=m.id
    where m.user_id=target_user and m.status='active' and p.status='approved'
      and (m.ends_at is null or m.ends_at>now())
  ) or exists (
    select 1 from public.enrollments e
    join public.courses c on c.id=e.course_id
    join public.payments p on p.enrollment_id=e.id
    where e.user_id=target_user and e.status='active' and p.status='approved'
      and (c.starts_at is null or c.starts_at<=now())
      and (c.ends_at is null or c.ends_at>now())
  )
$$;

create or replace function public.has_paid_panel_access(target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public
as $$ select public.has_paid_course_access(target_user) or public.has_active_club_access(target_user) $$;

drop policy if exists "published content read" on public.club_content;
create policy "paid users read entitled content" on public.club_content
for select to authenticated using (
  public.is_admin() or (
    published and (
      (access_scope='club' and public.has_active_club_access()) or
      (access_scope='course' and exists (
        select 1 from public.enrollments e
        join public.payments p on p.enrollment_id=e.id
        where e.user_id=auth.uid() and e.status in ('active','completed')
          and p.status='approved'
          and (club_content.course_id is null or club_content.course_id=e.course_id)
      ))
    )
  )
);

-- Las descargas privadas tambien requieren Club vigente.
drop policy if exists "members download private files" on storage.objects;
create policy "active club downloads private files" on storage.objects
for select to authenticated using (
  bucket_id='member-downloads' and (public.has_active_club_access() or public.is_admin())
);

