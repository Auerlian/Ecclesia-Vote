-- 0003_ballotbox — ballot box zone (§4.2). Anonymous ballots + the public credential set.
-- No FK to identity. The only shared key is election_id, by value (§4.2).

-- REDLINE Edit A: the election's public credential SET, keyed by election only — never by voter.
-- The cast function checks membership here to accept a ballot (anti-stuffing); the verifier checks
-- every ballot's credential is in this set. Inserted in randomised order (§3.3) so position leaks
-- no issuance/voter order.
create table ballotbox.election_credentials (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null,
  public_credential text not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  unique (election_id, public_credential)
);

create table ballotbox.ballots (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null,
  anonymous_ballot_id text unique not null,
  public_credential text not null, -- which credential cast it (NOT who owns it)
  encrypted_vote_payload jsonb not null,
  ballot_hash text unique not null, -- sha256(JCS(payload))
  receipt_phrase text not null,
  accepted_at timestamptz not null default now(),
  is_replaced boolean not null default false,
  replaced_by_ballot_id uuid references ballotbox.ballots (id),
  created_at timestamptz not null default now(),
  unique (election_id, receipt_phrase)
);

-- REDLINE Edit C / INV-3: at most one CURRENT ballot per credential, enforced by the database,
-- not by application logic. The cast function retires the old ballot before inserting the new one,
-- so the two-current state never exists even under concurrency.
create unique index ballots_one_current_per_credential
  on ballotbox.ballots (election_id, public_credential)
  where is_replaced = false;

create index ballots_by_election on ballotbox.ballots (election_id);

create table ballotbox.audited_ballots ( -- Benaloh reveals; never counted (§4.2)
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null,
  ballot_hash text not null,
  revealed_randomness jsonb not null,
  claimed_plaintext jsonb not null,
  created_at timestamptz not null default now()
);

create table ballotbox.audit_events (
  id bigint generated always as identity primary key,
  election_id uuid,
  organisation_id uuid,
  event_type text not null,
  event_payload jsonb not null,
  event_hash text not null,
  previous_event_hash text not null,
  created_at timestamptz not null default now()
);

create index audit_events_by_election on ballotbox.audit_events (election_id, id);

-- REDLINE Edit B / INV-2: the public board carries the receipt phrase and replaced status ONLY.
-- No ballot_hash, no payload — so a coercer who learns a receipt cannot chain it to a vote.
create view ballotbox.public_board as
select
  election_id,
  receipt_phrase,
  is_replaced
from ballotbox.ballots;

-- Aggregate turnout for admins — counts only, never ballot rows (§4.3).
create view identity.turnout as
select
  election_id,
  count(*) filter (where has_voted) as voted,
  count(*) as eligible
from identity.election_eligibility
group by election_id;
