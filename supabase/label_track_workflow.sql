-- MUSIK: separa la aprobación del sello de la publicación en el sitio.
-- Ejecutar una vez si track_submissions ya existe.

alter table public.track_submissions
  add column if not exists site_published boolean not null default false,
  add column if not exists published_at timestamptz;

-- Conserva como públicos los temas que ya estaban aprobados en el sistema anterior.
update public.track_submissions
set site_published=true,
    published_at=coalesce(published_at,reviewed_at,now())
where status='approved' and not site_published;

drop policy if exists "approved tracks public read" on public.track_submissions;
drop policy if exists "published tracks public read" on public.track_submissions;
create policy "published tracks public read"
on public.track_submissions for select to anon using (site_published);

