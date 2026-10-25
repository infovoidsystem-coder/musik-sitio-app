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
using (
  recipient_email is null
  or lower(recipient_email)=lower((select email from public.profiles where id=auth.uid()))
  or public.is_admin()
);

create policy "admin manages deliveries" on public.member_deliveries for all to authenticated
using (public.is_admin()) with check (public.is_admin());
