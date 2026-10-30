-- MUSIK: datos administrativos editables desde la ficha de cada alumno.
-- Ejecutar una sola vez en Supabase > SQL Editor.

alter table public.profiles
  add column if not exists document_number text,
  add column if not exists birth_date date,
  add column if not exists address text,
  add column if not exists emergency_contact text,
  add column if not exists current_course text,
  add column if not exists membership_label text,
  add column if not exists account_status text not null default 'pendiente',
  add column if not exists admin_notes text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_account_status_check'
  ) then
    alter table public.profiles add constraint profiles_account_status_check
      check (account_status in ('activo','pendiente','pausado','finalizado'));
  end if;
end $$;

comment on column public.profiles.admin_notes is
  'Observaciones privadas visibles únicamente para administradores mediante RLS.';
