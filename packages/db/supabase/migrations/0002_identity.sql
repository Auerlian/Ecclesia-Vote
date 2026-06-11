-- 0002_identity — identity zone (§4.1). Knows who is eligible and who has voted; never the vote.

create table identity.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text unique not null check (slug ~ '^[a-z0-9-]{3,60}$'),
  min_aggregate_n int not null default 10,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table identity.organisation_members (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references identity.organisations (id),
  user_id uuid not null references auth.users (id),
  role text not null check (role in ('owner', 'admin', 'member', 'observer')),
  created_at timestamptz not null default now(),
  unique (organisation_id, user_id)
);

create table identity.voters (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references identity.organisations (id),
  email citext not null,
  display_name text,
  external_member_id text,
  status text not null default 'invited' check (status in ('invited', 'active', 'removed')),
  user_id uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (organisation_id, email),
  unique (organisation_id, external_member_id)
);

create table identity.elections (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references identity.organisations (id),
  title text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'discussion', 'open', 'closed', 'tallied', 'published', 'archived')),
  vote_type text not null check (vote_type in ('yes_no', 'multiple_choice', 'approval')),
  allow_abstain boolean not null default true,
  allow_revote boolean not null default true,
  engine_id text not null default 'mock-v1',
  engine_security_class text not null default 'PROTOTYPE',
  engine_election_ref jsonb,
  discussion_opens_at timestamptz,
  voting_opens_at timestamptz not null,
  voting_closes_at timestamptz not null,
  results_visibility text not null default 'after_close'
    check (results_visibility in ('after_close', 'live_non_secret')),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  check (voting_closes_at > voting_opens_at)
);

create table identity.election_options (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references identity.elections (id),
  label text not null,
  description text,
  position int not null,
  created_at timestamptz not null default now(),
  unique (election_id, position)
);

-- REDLINE Edit A: NO public_credential column here.
-- The identity zone records that a credential was issued (credential_status) and whether the
-- human has voted (has_voted) — the only identity<->* joins INV-1 permits. It never learns which
-- public credential belongs to which voter; that mapping lives only in the credauth zone.
create table identity.election_eligibility (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references identity.elections (id),
  voter_id uuid not null references identity.voters (id),
  credential_status text not null default 'not_issued'
    check (credential_status in ('not_issued', 'issued', 'revoked')),
  has_voted boolean not null default false,
  has_voted_bucket timestamptz, -- 10-minute bucket (§3.3, redline Edit D)
  created_at timestamptz not null default now(),
  unique (election_id, voter_id)
);

create index election_eligibility_by_election on identity.election_eligibility (election_id);
create index voters_by_org on identity.voters (organisation_id);
create index elections_by_org on identity.elections (organisation_id);
