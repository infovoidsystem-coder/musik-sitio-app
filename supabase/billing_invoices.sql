-- Capa neutral de facturación. Compatible con ARCA o un sistema de gestión externo.
create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.payments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'pending_integration',
  status text not null default 'pending' check (status in ('pending','processing','issued','sent','failed','cancelled')),
  invoice_type text,
  point_of_sale text,
  invoice_number text,
  cae text,
  cae_expires_at date,
  pdf_url text,
  recipient_email text,
  issued_at timestamptz,
  sent_at timestamptz,
  last_sync_at timestamptz,
  error_message text,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.billing_invoices(id) on delete cascade,
  event_type text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists billing_invoices_user_idx on public.billing_invoices(user_id);
create index if not exists billing_invoices_status_idx on public.billing_invoices(status);
alter table public.billing_invoices enable row level security;
alter table public.billing_events enable row level security;
create policy "members read own invoices" on public.billing_invoices for select to authenticated using (user_id=auth.uid() or public.is_admin());
create policy "admin manages invoices" on public.billing_invoices for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "members read own invoice events" on public.billing_events for select to authenticated using (exists(select 1 from public.billing_invoices i where i.id=invoice_id and (i.user_id=auth.uid() or public.is_admin())));
create policy "admin manages invoice events" on public.billing_events for all to authenticated using (public.is_admin()) with check (public.is_admin());

