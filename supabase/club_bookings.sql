-- Reservas del Club y notificaciones del alumno.
-- Ejecutar una vez en Supabase SQL Editor.

create table if not exists public.club_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  member_email text not null,
  member_name text,
  member_artist_name text,
  event_key text not null,
  booking_type text not null check (booking_type in ('clase','practica','evento','sala','curso')),
  title text not null,
  day text not null,
  month text not null,
  time_label text not null,
  place text not null,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled','attended','no_show')),
  created_at timestamptz not null default now(),
  unique (user_id,event_key)
);

create table if not exists public.member_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null default 'booking',
  title text not null,
  body text not null,
  booking_id uuid references public.club_bookings(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists club_bookings_user_idx on public.club_bookings(user_id);
create index if not exists club_bookings_status_idx on public.club_bookings(status);
create index if not exists member_notifications_user_idx on public.member_notifications(user_id);

alter table public.club_bookings enable row level security;
alter table public.member_notifications enable row level security;

create policy "members read own club bookings" on public.club_bookings for select to authenticated using (user_id=auth.uid() or public.is_admin());
create policy "members create own club bookings" on public.club_bookings for insert to authenticated with check (user_id=auth.uid());
create policy "members cancel own club bookings" on public.club_bookings for update to authenticated using (user_id=auth.uid() or public.is_admin()) with check (user_id=auth.uid() or public.is_admin());
create policy "admin manages club bookings" on public.club_bookings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "members read own notifications" on public.member_notifications for select to authenticated using (user_id=auth.uid() or public.is_admin());
create policy "members update own notifications" on public.member_notifications for update to authenticated using (user_id=auth.uid() or public.is_admin()) with check (user_id=auth.uid() or public.is_admin());
create policy "admin manages notifications" on public.member_notifications for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.notify_club_booking()
returns trigger language plpgsql security definer set search_path=public
as $$ begin
  insert into public.member_notifications(user_id,type,title,body,booking_id)
  values(new.user_id,'booking','Reserva confirmada',new.title||' · '||new.day||' '||new.month||' · '||new.time_label||' h · '||new.place,new.id);
  return new;
end $$;

drop trigger if exists on_club_booking_created on public.club_bookings;
create trigger on_club_booking_created after insert on public.club_bookings
for each row execute procedure public.notify_club_booking();
