-- Seed for local dev (WP-01): 1 org, 1 owner, 25 voters, plus a demo yes/no election.
-- Targets the Supabase local auth schema. Idempotent-ish via fixed UUIDs + ON CONFLICT.

-- Owner auth user -----------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token,
  raw_app_meta_data, raw_user_meta_data
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-0000000000aa',
  'authenticated', 'authenticated', 'owner@demo-society.example',
  crypt('password123', gen_salt('bf')),
  now(), now(), now(), '', '',
  '{"provider":"email","providers":["email"]}', '{}'
) on conflict (id) do nothing;

-- Organisation + owner membership ------------------------------------------
insert into identity.organisations (id, name, slug, created_by)
values ('00000000-0000-0000-0000-0000000000b0', 'Demo Society', 'demo-society',
        '00000000-0000-0000-0000-0000000000aa')
on conflict (id) do nothing;

insert into identity.organisation_members (organisation_id, user_id, role)
values ('00000000-0000-0000-0000-0000000000b0', '00000000-0000-0000-0000-0000000000aa', 'owner')
on conflict (organisation_id, user_id) do nothing;

-- 25 voters -----------------------------------------------------------------
insert into identity.voters (organisation_id, email, display_name, external_member_id, status)
select
  '00000000-0000-0000-0000-0000000000b0',
  'voter' || g || '@demo-society.example',
  'Voter ' || g,
  'M' || lpad(g::text, 4, '0'),
  'invited'
from generate_series(1, 25) as g
on conflict (organisation_id, email) do nothing;

-- Demo yes/no election (open now) + eligibility for all voters --------------
insert into identity.elections (
  id, organisation_id, title, description, status, vote_type,
  voting_opens_at, voting_closes_at, created_by
) values (
  '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000b0',
  'Adopt the new bylaws?', 'A demonstration advisory vote.', 'open', 'yes_no',
  now() - interval '1 hour', now() + interval '7 days',
  '00000000-0000-0000-0000-0000000000aa'
) on conflict (id) do nothing;

insert into identity.election_eligibility (election_id, voter_id, credential_status)
select '00000000-0000-0000-0000-0000000000e1', v.id, 'issued'
from identity.voters v
where v.organisation_id = '00000000-0000-0000-0000-0000000000b0'
on conflict (election_id, voter_id) do nothing;
