-- MUSIK Rewards: puntos por compras/cursos, premios y seguimiento académico.
-- Ejecutar una vez en Supabase SQL Editor después de schema.sql.

create table if not exists public.loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  points_required integer not null check (points_required > 0),
  auto_unlock boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.loyalty_point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null check (points <> 0),
  reason text not null,
  source_type text not null default 'admin' check (source_type in ('purchase','course','admin','bonus')),
  source_id uuid,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create unique index if not exists loyalty_event_source_unique
  on public.loyalty_point_events(user_id,source_type,source_id)
  where source_id is not null;
create index if not exists loyalty_events_user_idx on public.loyalty_point_events(user_id,created_at desc);

create table if not exists public.user_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_id uuid not null references public.loyalty_rewards(id) on delete cascade,
  status text not null default 'unlocked' check (status in ('unlocked','assigned','delivered','cancelled')),
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(),
  delivered_at timestamptz,
  notes text,
  unique(user_id,reward_id)
);

create or replace view public.loyalty_balances
with (security_invoker=true) as
select p.id as user_id,p.email,p.full_name,p.artist_name,coalesce(sum(e.points),0)::integer as points
from public.profiles p left join public.loyalty_point_events e on e.user_id=p.id
group by p.id,p.email,p.full_name,p.artist_name;

create or replace function public.unlock_loyalty_rewards(target_user uuid)
returns void language plpgsql security definer set search_path=public as $$
declare current_points integer;
begin
  select coalesce(sum(points),0)::integer into current_points from public.loyalty_point_events where user_id=target_user;
  insert into public.user_rewards(user_id,reward_id,status)
  select target_user,r.id,'unlocked' from public.loyalty_rewards r
  where r.active and r.auto_unlock and r.points_required<=current_points
  on conflict(user_id,reward_id) do nothing;
end $$;

create or replace function public.loyalty_after_point_event()
returns trigger language plpgsql security definer set search_path=public as $$
begin perform public.unlock_loyalty_rewards(new.user_id); return new; end $$;
drop trigger if exists loyalty_unlock_after_points on public.loyalty_point_events;
create trigger loyalty_unlock_after_points after insert on public.loyalty_point_events
for each row execute procedure public.loyalty_after_point_event();

create or replace function public.loyalty_award_payment()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='approved' and (tg_op='INSERT' or old.status is distinct from 'approved') then
    insert into public.loyalty_point_events(user_id,points,reason,source_type,source_id)
    values(new.user_id,250,'Compra aprobada','purchase',new.id)
    on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists loyalty_points_payment on public.payments;
create trigger loyalty_points_payment after insert or update of status on public.payments
for each row execute procedure public.loyalty_award_payment();

-- Normaliza compras anteriores a la escala actual de MUSIK Rewards.
update public.loyalty_point_events set points=250 where source_type='purchase' and points<>250;

create or replace function public.loyalty_award_course()
returns trigger language plpgsql security definer set search_path=public as $$
declare course_title text;
begin
  if new.status='completed' and (tg_op='INSERT' or old.status is distinct from 'completed') then
    select title into course_title from public.courses where id=new.course_id;
    insert into public.loyalty_point_events(user_id,points,reason,source_type,source_id)
    values(new.user_id,500,'Curso completado · '||coalesce(course_title,'MUSIK'),'course',new.id)
    on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists loyalty_points_course on public.enrollments;
create trigger loyalty_points_course after insert or update of status on public.enrollments
for each row execute procedure public.loyalty_award_course();

alter table public.loyalty_rewards enable row level security;
alter table public.loyalty_point_events enable row level security;
alter table public.user_rewards enable row level security;
grant select on public.loyalty_balances to authenticated;

drop policy if exists "members read rewards catalog" on public.loyalty_rewards;
create policy "members read rewards catalog" on public.loyalty_rewards for select to authenticated using(active or public.is_admin());
drop policy if exists "members read own point events" on public.loyalty_point_events;
create policy "members read own point events" on public.loyalty_point_events for select to authenticated using(user_id=auth.uid() or public.is_admin());
drop policy if exists "members read own rewards" on public.user_rewards;
create policy "members read own rewards" on public.user_rewards for select to authenticated using(user_id=auth.uid() or public.is_admin());
drop policy if exists "admin manages rewards" on public.loyalty_rewards;
create policy "admin manages rewards" on public.loyalty_rewards for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admin manages points" on public.loyalty_point_events;
create policy "admin manages points" on public.loyalty_point_events for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admin manages user rewards" on public.user_rewards;
create policy "admin manages user rewards" on public.user_rewards for all to authenticated using(public.is_admin()) with check(public.is_admin());

-- Si la primera versión ya fue instalada, conserva los premios asignados y actualiza su propuesta.
update public.loyalty_rewards set title='Acceso a Masterclass MUSIK',description='Entrada a una masterclass seleccionada',points_required=500 where title='Guest Pass MUSIK';
update public.loyalty_rewards set title='1 hora de clase particular',description='Encuentro individual con un docente MUSIK',points_required=1000 where title='Feedback personalizado';
update public.loyalty_rewards set title='1 hora de grabación de video set',description='Cabina, equipamiento y espacio para grabar tu sesión',points_required=2000 where title='Hora de cabina';

insert into public.loyalty_rewards(title,description,points_required,auto_unlock)
select * from (values
  ('Acceso a Masterclass MUSIK','Entrada a una masterclass seleccionada',500,true),
  ('1 hora de clase particular','Encuentro individual con un docente MUSIK',1000,true),
  ('1 hora de grabación de video set','Cabina, equipamiento y espacio para grabar tu sesión',2000,true)
) as seed(title,description,points_required,auto_unlock)
where not exists(select 1 from public.loyalty_rewards);
