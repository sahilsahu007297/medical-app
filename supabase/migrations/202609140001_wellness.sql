-- Run once in the Supabase SQL editor, or apply with the Supabase CLI.
create table public.wellness_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null,
  date date not null,
  payload jsonb not null,
  primary key (user_id, device_id, date),
  constraint day_identity check (payload->>'deviceId' = device_id::text and payload->>'date' = date::text),
  constraint valid_steps check (jsonb_typeof(payload->'steps') = 'number' and (payload->>'steps')::numeric between 0 and 500000),
  constraint valid_water check (jsonb_typeof(payload->'water') = 'number' and (payload->>'water')::numeric between 0 and 50000),
  constraint day_fields check (payload ?& array['deviceId','date','steps','water','waterAt','checkin','checkinAt','updatedAt'])
);
create table public.workouts (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  date date not null,
  payload jsonb not null,
  primary key (user_id,id),
  constraint workout_identity check (payload->>'id' = id::text and payload->>'date' = date::text),
  constraint valid_duration check (jsonb_typeof(payload->'seconds') = 'number' and (payload->>'seconds')::numeric >= 60),
  constraint workout_fields check (payload ?& array['id','date','type','seconds','steps','finishedAt'])
);
create index workouts_user_date on public.workouts(user_id,date desc);
alter table public.wellness_days enable row level security;
alter table public.workouts enable row level security;
revoke all on public.wellness_days, public.workouts from anon, authenticated;
grant select, insert, update, delete on public.wellness_days, public.workouts to authenticated;
create policy "Read own daily records" on public.wellness_days for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own daily records" on public.wellness_days for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own daily records" on public.wellness_days for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own daily records" on public.wellness_days for delete to authenticated using ((select auth.uid()) = user_id);
create policy "Read own workouts" on public.workouts for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own workouts" on public.workouts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own workouts" on public.workouts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own workouts" on public.workouts for delete to authenticated using ((select auth.uid()) = user_id);

-- Idempotent retries cannot roll back step totals or newer check-ins/hydration.
create function public.merge_wellness_day() returns trigger language plpgsql set search_path = '' as $$
begin
  new.payload := new.payload || jsonb_build_object(
    'steps', greatest((old.payload->>'steps')::numeric,(new.payload->>'steps')::numeric),
    'water', case when coalesce(old.payload->>'waterAt','') > coalesce(new.payload->>'waterAt','') then old.payload->'water' else new.payload->'water' end,
    'waterAt', greatest(old.payload->>'waterAt',new.payload->>'waterAt'),
    'checkin', case when coalesce(old.payload->>'checkinAt','') > coalesce(new.payload->>'checkinAt','') then old.payload->'checkin' else new.payload->'checkin' end,
    'checkinAt', greatest(old.payload->>'checkinAt',new.payload->>'checkinAt'),
    'updatedAt', greatest(old.payload->>'updatedAt',new.payload->>'updatedAt'),
    'heart', (select coalesce(jsonb_agg(p order by (p->>'at')::bigint),'[]'::jsonb) from
      (select p from (select distinct p from jsonb_array_elements(coalesce(old.payload->'heart','[]'::jsonb) || coalesce(new.payload->'heart','[]'::jsonb)) p) unique_points order by (p->>'at')::bigint desc limit 1440) recent)
  );
  return new;
end; $$;
create trigger merge_daily_record before update on public.wellness_days for each row execute function public.merge_wellness_day();

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('health-records','health-records',false,10485760,array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;
create policy "Read own health files" on storage.objects for select to authenticated
using (bucket_id = 'health-records' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Upload own health files" on storage.objects for insert to authenticated
with check (bucket_id = 'health-records' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Delete own health files" on storage.objects for delete to authenticated
using (bucket_id = 'health-records' and (storage.foldername(name))[1] = (select auth.uid())::text);
