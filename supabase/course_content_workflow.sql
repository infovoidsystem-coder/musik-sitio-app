-- MUSIK: archivos y distribución de contenido por curso.
-- Ejecutar después de paid_access_model.sql y access_controls.sql.

alter table public.club_content
  add column if not exists file_path text,
  add column if not exists file_name text,
  add column if not exists file_kind text
    check (file_kind is null or file_kind in ('pdf','image'));

create index if not exists club_content_course_idx
  on public.club_content(course_id)
  where access_scope='course';

create index if not exists enrollments_course_status_idx
  on public.enrollments(course_id,status);

comment on column public.club_content.course_id is
  'Curso destinatario. Los alumnos acceden mediante su inscripción aprobada.';

