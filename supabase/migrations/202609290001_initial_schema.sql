-- VozSkin Scan AI initial schema. Review and run in a dedicated Supabase project.
-- Sensitive image buckets are private; no public read policies are created.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin', 'clinic')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.screening_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'processing', 'completed', 'failed')),
  consent_given boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  model_name text,
  model_version text,
  input_schema_version text,
  prediction_timestamp timestamptz,
  constraint screening_completed_trace check (status <> 'completed' or (model_name is not null and model_version is not null and prediction_timestamp is not null))
);
create index if not exists screening_sessions_user_created_idx on public.screening_sessions(user_id, created_at desc);

create table if not exists public.skin_images (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.screening_sessions(id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_size bigint not null check (file_size > 0 and file_size <= 10485760),
  image_quality_score numeric(4,3) check (image_quality_score is null or image_quality_score between 0 and 1),
  quality_status text not null default 'pending' check (quality_status in ('pending', 'passed', 'rejected')),
  width integer check (width is null or width between 1 and 20000),
  height integer check (height is null or height between 1 and 20000),
  created_at timestamptz not null default now()
);
create index if not exists skin_images_session_idx on public.skin_images(session_id);

create table if not exists public.symptom_assessments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.screening_sessions(id) on delete cascade,
  answers_json jsonb not null check (jsonb_typeof(answers_json) = 'object'),
  created_at timestamptz not null default now()
);

create table if not exists public.screening_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.screening_sessions(id) on delete cascade,
  screening_level text not null check (screening_level in ('LOW', 'MODERATE', 'HIGH', 'INSUFFICIENT_INFORMATION')),
  probability numeric(5,4) check (probability is null or probability between 0 and 1),
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  uncertainty text not null check (uncertainty in ('low', 'moderate', 'high')),
  signals_json jsonb not null default '[]'::jsonb check (jsonb_typeof(signals_json) = 'array'),
  recommendation text not null check (recommendation in ('professional_evaluation', 'routine_follow_up', 'insufficient_information')),
  model_name text not null,
  model_version text not null,
  input_schema_version text not null,
  prediction_timestamp timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists screening_results_created_idx on public.screening_results(created_at desc);

create table if not exists public.tracking_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists tracking_sessions_user_created_idx on public.tracking_sessions(user_id, created_at desc);

create table if not exists public.tracking_images (
  id uuid primary key default gen_random_uuid(),
  tracking_session_id uuid not null references public.tracking_sessions(id) on delete cascade,
  image_id uuid not null references public.skin_images(id) on delete cascade,
  sequence_number integer not null check (sequence_number > 0),
  created_at timestamptz not null default now(),
  unique (tracking_session_id, sequence_number),
  unique (tracking_session_id, image_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.screening_sessions(id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists reports_user_created_idx on public.reports(user_id, created_at desc);

create table if not exists public.patient_access (
  id uuid primary key default gen_random_uuid(),
  clinic_user_id uuid not null references auth.users(id) on delete cascade,
  patient_user_id uuid not null references auth.users(id) on delete cascade,
  permission text not null default 'read' check (permission in ('read', 'read_reports')),
  authorized_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (clinic_user_id, patient_user_id)
);
create index if not exists patient_access_patient_idx on public.patient_access(patient_user_id);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) <= 100),
  resource_type text not null check (char_length(resource_type) <= 100),
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(public.current_profile_role() = 'admin', false)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create or replace function public.is_clinic_user()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(public.current_profile_role() = 'clinic', false)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'clinic', false);
$$;

create or replace function public.has_patient_access(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.patient_access pa
    where pa.clinic_user_id = auth.uid()
      and pa.patient_user_id = target_user_id
      and pa.permission in ('read', 'read_reports')
      and (pa.expires_at is null or pa.expires_at > now())
      and public.is_clinic_user()
  );
$$;

create or replace function public.has_patient_report_access(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.patient_access pa
    where pa.clinic_user_id = auth.uid()
      and pa.patient_user_id = target_user_id
      and pa.permission = 'read_reports'
      and (pa.expires_at is null or pa.expires_at > now())
      and public.is_clinic_user()
  );
$$;

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, role)
  values (new.id, nullif(left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80), ''), 'user')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.create_profile_for_auth_user();

create or replace function public.keep_profile_role_server_managed()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    raise exception 'Profile role can only be changed by a trusted server administrator';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles for each row execute procedure public.keep_profile_role_server_managed();

alter table public.profiles enable row level security;
alter table public.screening_sessions enable row level security;
alter table public.skin_images enable row level security;
alter table public.symptom_assessments enable row level security;
alter table public.screening_results enable row level security;
alter table public.tracking_sessions enable row level security;
alter table public.tracking_images enable row level security;
alter table public.reports enable row level security;
alter table public.patient_access enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: roles cannot be assigned by an authenticated user (trigger enforces this too).
drop policy if exists profiles_select_owner_or_admin on public.profiles;
create policy profiles_select_owner_or_admin on public.profiles for select to authenticated
using (user_id = auth.uid() or public.is_admin() or public.has_patient_access(user_id));
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A consented owner controls their own screening session.
drop policy if exists sessions_select_owner_or_authorized_clinic on public.screening_sessions;
create policy sessions_select_owner_or_authorized_clinic on public.screening_sessions for select to authenticated
using (user_id = auth.uid() or public.has_patient_access(user_id) or public.is_admin());
drop policy if exists sessions_insert_owner on public.screening_sessions;
create policy sessions_insert_owner on public.screening_sessions for insert to authenticated
with check (
  user_id = auth.uid() and consent_given = true and status = 'draft'
  and completed_at is null and model_name is null and model_version is null
  and input_schema_version is null and prediction_timestamp is null
);
-- No authenticated UPDATE policy: trusted server code alone advances a session or attaches model metadata.
drop policy if exists sessions_update_owner on public.screening_sessions;
drop policy if exists sessions_delete_owner on public.screening_sessions;
create policy sessions_delete_owner on public.screening_sessions for delete to authenticated
using (user_id = auth.uid());

-- Related data can only be read through an owned/authorized session. Predictions are server-written.
drop policy if exists images_select_related on public.skin_images;
create policy images_select_related on public.skin_images for select to authenticated
using (exists (select 1 from public.screening_sessions s where s.id = session_id and (s.user_id = auth.uid() or public.has_patient_access(s.user_id) or public.is_admin())));
drop policy if exists images_insert_related on public.skin_images;
create policy images_insert_related on public.skin_images for insert to authenticated
with check (
  quality_status = 'pending' and image_quality_score is null
  and exists (select 1 from public.screening_sessions s where s.id = session_id and s.user_id = auth.uid() and s.consent_given = true)
);
drop policy if exists images_delete_related on public.skin_images;
create policy images_delete_related on public.skin_images for delete to authenticated
using (exists (select 1 from public.screening_sessions s where s.id = session_id and s.user_id = auth.uid()));

drop policy if exists assessments_select_related on public.symptom_assessments;
create policy assessments_select_related on public.symptom_assessments for select to authenticated
using (exists (select 1 from public.screening_sessions s where s.id = session_id and (s.user_id = auth.uid() or public.has_patient_access(s.user_id) or public.is_admin())));
drop policy if exists assessments_insert_owner on public.symptom_assessments;
create policy assessments_insert_owner on public.symptom_assessments for insert to authenticated
with check (exists (select 1 from public.screening_sessions s where s.id = session_id and s.user_id = auth.uid() and s.consent_given = true));
drop policy if exists assessments_delete_owner on public.symptom_assessments;
create policy assessments_delete_owner on public.symptom_assessments for delete to authenticated
using (exists (select 1 from public.screening_sessions s where s.id = session_id and s.user_id = auth.uid()));

drop policy if exists results_select_related on public.screening_results;
create policy results_select_related on public.screening_results for select to authenticated
using (exists (select 1 from public.screening_sessions s where s.id = session_id and (s.user_id = auth.uid() or public.has_patient_access(s.user_id) or public.is_admin())));
-- No INSERT/UPDATE policy for client roles: trusted inference service writes predictions.

drop policy if exists tracking_sessions_select_owner on public.tracking_sessions;
create policy tracking_sessions_select_owner on public.tracking_sessions for select to authenticated
using (user_id = auth.uid() or public.is_admin());
drop policy if exists tracking_sessions_write_owner on public.tracking_sessions;
create policy tracking_sessions_write_owner on public.tracking_sessions for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists tracking_images_select_authorized on public.tracking_images;
create policy tracking_images_select_authorized on public.tracking_images for select to authenticated
using (exists (select 1 from public.tracking_sessions t where t.id = tracking_session_id and (t.user_id = auth.uid() or public.is_admin())));
drop policy if exists tracking_images_write_owner on public.tracking_images;
create policy tracking_images_write_owner on public.tracking_images for all to authenticated
using (exists (select 1 from public.tracking_sessions t where t.id = tracking_session_id and t.user_id = auth.uid()))
with check (exists (select 1 from public.tracking_sessions t where t.id = tracking_session_id and t.user_id = auth.uid()));

drop policy if exists reports_select_owner_or_authorized on public.reports;
create policy reports_select_owner_or_authorized on public.reports for select to authenticated
using (user_id = auth.uid() or public.has_patient_report_access(user_id) or public.is_admin());
drop policy if exists reports_delete_owner on public.reports;
create policy reports_delete_owner on public.reports for delete to authenticated
using (user_id = auth.uid());

drop policy if exists patient_access_select_participants on public.patient_access;
create policy patient_access_select_participants on public.patient_access for select to authenticated
using (clinic_user_id = auth.uid() or patient_user_id = auth.uid() or public.is_admin());
-- Grants are created through a trusted administrative process, not the client.

drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin on public.audit_logs for select to authenticated using (public.is_admin());
-- Audit log inserts are server-only; never accept arbitrary audit records from the browser.

-- Private buckets. Storage object paths are prefixed with the owning auth user UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('skin-images', 'skin-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('reports', 'reports', false, 10485760, array['application/pdf']),
  ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false;

create policy "skin image owner select" on storage.objects for select to authenticated
using (bucket_id = 'skin-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "skin image owner insert" on storage.objects for insert to authenticated
with check (bucket_id = 'skin-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "skin image owner delete" on storage.objects for delete to authenticated
using (bucket_id = 'skin-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "report owner select" on storage.objects for select to authenticated
using (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "report owner delete" on storage.objects for delete to authenticated
using (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatar owner select" on storage.objects for select to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar owner insert" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar owner update" on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar owner delete" on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Aggregated admin views contain no user identifiers and are service-role only.
create or replace view public.admin_daily_analytics with (security_invoker = false) as
  select 'scans'::text as metric, date_trunc('day', created_at)::date as day, count(*)::bigint as total
  from public.screening_sessions where created_at >= current_date - interval '13 days'
  group by 1, 2
  union all
  select 'registrations'::text as metric, date_trunc('day', created_at)::date as day, count(*)::bigint as total
  from public.profiles where created_at >= current_date - interval '13 days'
  group by 1, 2;
create or replace view public.admin_screening_distribution with (security_invoker = false) as
  select screening_level as level, count(*)::bigint as total from public.screening_results group by screening_level;
create or replace view public.admin_image_quality_summary with (security_invoker = false) as
  select quality_status as status, count(*)::bigint as total from public.skin_images group by quality_status;
create or replace view public.admin_uncertainty_distribution with (security_invoker = false) as
  select uncertainty, count(*)::bigint as total from public.screening_results group by uncertainty;
create or replace view public.admin_user_scan_counts with (security_invoker = false) as
  select user_id, count(*)::bigint as total from public.screening_sessions group by user_id;
revoke all on public.admin_daily_analytics, public.admin_screening_distribution, public.admin_image_quality_summary, public.admin_uncertainty_distribution, public.admin_user_scan_counts from public, anon, authenticated;
grant select on public.admin_daily_analytics, public.admin_screening_distribution, public.admin_image_quality_summary, public.admin_uncertainty_distribution, public.admin_user_scan_counts to service_role;
