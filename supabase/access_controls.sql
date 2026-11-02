-- MUSIK: control administrativo de vigencia y contenido por alumno.
-- Ejecutar una vez en Supabase SQL Editor después de paid_access_model.sql.

alter table public.profiles
  add column if not exists access_mode text not null default 'automatic'
    check (access_mode in ('automatic','manual_on','manual_off')),
  add column if not exists access_ends_at timestamptz,
  add column if not exists content_enabled boolean not null default true;

comment on column public.profiles.access_mode is
  'automatic respeta pagos; manual_on habilita; manual_off bloquea el panel';
comment on column public.profiles.access_ends_at is
  'Vencimiento administrativo. Null equivale a sin vencimiento manual.';

create or replace function public.has_manual_access(target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id=target_user
      and p.access_mode='manual_on'
      and p.content_enabled
      and (p.access_ends_at is null or p.access_ends_at>now())
  )
$$;

create or replace function public.is_manually_blocked(target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id=target_user
      and (p.access_mode='manual_off' or not p.content_enabled
        or (p.access_mode='manual_on' and p.access_ends_at is not null and p.access_ends_at<=now()))
  )
$$;

create or replace function public.has_paid_panel_access(target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public
as $$
  select case
    when public.is_manually_blocked(target_user) then false
    when public.has_manual_access(target_user) then true
    else public.has_paid_course_access(target_user) or public.has_active_club_access(target_user)
  end
$$;

drop policy if exists "paid users read entitled content" on public.club_content;
create policy "paid or manually enabled users read entitled content"
on public.club_content for select to authenticated using (
  public.is_admin() or (
    not public.is_manually_blocked() and published and (
      (access_scope='club' and (public.has_manual_access() or public.has_active_club_access())) or
      (access_scope='course' and (
        public.has_manual_access() or exists (
          select 1 from public.enrollments e
          join public.payments p on p.enrollment_id=e.id
          where e.user_id=auth.uid()
            and e.status in ('active','completed')
            and p.status='approved'
            and (club_content.course_id is null or club_content.course_id=e.course_id)
        )
      ))
    )
  )
);

drop policy if exists "active club downloads private files" on storage.objects;
create policy "active or manually enabled club downloads"
on storage.objects for select to authenticated using (
  bucket_id='member-downloads'
  and not public.is_manually_blocked()
  and (public.has_manual_access() or public.has_active_club_access() or public.is_admin())
);
