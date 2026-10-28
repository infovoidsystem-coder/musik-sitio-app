-- MUSIK · base del módulo de facturación ARCA
-- Ejecutar después de billing_invoices.sql al preparar el entorno del cliente.
-- Los certificados y claves privadas NO se guardan en tablas: deben vivir como
-- secretos del backend (Supabase Edge Function Secrets o un secret manager).

create table if not exists public.billing_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  cuit text not null,
  tax_condition text not null check (tax_condition in ('monotributo','responsable_inscripto','exento')),
  point_of_sale integer not null check (point_of_sale > 0),
  default_invoice_type text not null check (default_invoice_type in ('A','B','C')),
  provider text not null default 'arca_direct',
  environment text not null default 'homologation' check (environment in ('homologation','production')),
  certificate_status text not null default 'pending' check (certificate_status in ('pending','verified','expired','revoked')),
  certificate_expires_at timestamptz,
  automatic_issue boolean not null default false,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_audit_log (
  id bigint generated always as identity primary key,
  invoice_id uuid references public.billing_invoices(id) on delete set null,
  actor_id uuid references auth.users(id),
  action text not null,
  result text not null check (result in ('success','warning','error')),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.billing_settings enable row level security;
alter table public.billing_audit_log enable row level security;

create policy "admins manage billing settings" on public.billing_settings
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins read billing audit" on public.billing_audit_log
for select using (public.is_admin());

create index if not exists billing_audit_invoice_idx
on public.billing_audit_log(invoice_id, created_at desc);

