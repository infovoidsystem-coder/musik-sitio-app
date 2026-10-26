-- Extensión del esquema para Checkout Pro de Mercado Pago.
-- Ejecutar después de supabase/schema.sql.
alter table public.payments add column if not exists external_reference text unique;
alter table public.payments add column if not exists provider_preference_id text;
alter table public.payments add column if not exists status_detail text;
alter table public.payments add column if not exists updated_at timestamptz not null default now();
create index if not exists payments_external_reference_idx on public.payments(external_reference);

