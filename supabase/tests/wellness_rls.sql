-- Run after the migration in an isolated Supabase test database. Rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(10);
insert into auth.users(id,email) values
('11111111-1111-4111-8111-111111111111','rest-test-a@example.invalid'),
('22222222-2222-4222-8222-222222222222','rest-test-b@example.invalid');
insert into public.wellness_days values
('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-09-14',
'{"deviceId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","date":"2026-09-14","steps":120,"water":250,"waterAt":"2026-09-14T12:00:00Z","checkin":null,"checkinAt":"","updatedAt":"2026-09-14T12:00:00Z"}'),
('22222222-2222-4222-8222-222222222222','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','2026-09-14',
'{"deviceId":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","date":"2026-09-14","steps":200,"water":0,"waterAt":"","checkin":null,"checkinAt":"","updatedAt":"2026-09-14T12:00:00Z"}');
insert into public.workouts values
('22222222-2222-4222-8222-222222222222','cccccccc-cccc-4ccc-8ccc-cccccccccccc','2026-09-14','{"id":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","date":"2026-09-14","type":"Walking","seconds":60,"steps":100,"finishedAt":"2026-09-14T12:00:00Z"}');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select is((select count(*)::integer from public.wellness_days),1,'User sees only their day');
select is((select count(*)::integer from public.workouts),0,'User cannot read another account workouts');
select throws_ok($$insert into public.workouts values ('22222222-2222-4222-8222-222222222222','dddddddd-dddd-4ddd-8ddd-dddddddddddd','2026-09-14','{"id":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","date":"2026-09-14","type":"Yoga","seconds":60,"steps":0,"finishedAt":"2026-09-14T12:00:00Z"}')$$,'42501',null,'Cannot insert a workout for another user');
update public.wellness_days set payload=payload || '{"steps":10,"water":0,"waterAt":"2026-09-14T10:00:00Z","updatedAt":"2026-09-14T10:00:00Z"}'::jsonb;
select is((select (payload->>'steps')::integer from public.wellness_days),120,'Stale retry cannot decrease steps');
select is((select (payload->>'water')::integer from public.wellness_days),250,'Stale retry cannot replace newer water');
select lives_ok($$insert into storage.objects(bucket_id,name) values ('health-records','11111111-1111-4111-8111-111111111111/test.pdf')$$,'Can upload in own folder');
select throws_ok($$insert into storage.objects(bucket_id,name) values ('health-records','22222222-2222-4222-8222-222222222222/test.pdf')$$,'42501',null,'Cannot upload into another user folder');
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select is((select count(*)::integer from storage.objects where bucket_id='health-records'),0,'Cannot see another user private files');
set local role anon;
select throws_ok($$select * from public.wellness_days$$,'42501',null,'Anonymous users have no day access');
select throws_ok($$select * from public.workouts$$,'42501',null,'Anonymous users have no workout access');
reset role;
select * from finish();
rollback;
