-- MUSIK: nombre artístico del alumno en su ficha y en sus reservas.
-- Es seguro ejecutar esta migración más de una vez.

alter table public.profiles
  add column if not exists artist_name text;

alter table public.club_bookings
  add column if not exists member_artist_name text;

comment on column public.profiles.artist_name is
  'Nombre artístico, alias o nombre de fantasía del alumno.';

comment on column public.club_bookings.member_artist_name is
  'Nombre artístico informado o guardado al confirmar la reserva.';
