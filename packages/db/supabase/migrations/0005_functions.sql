-- 0005_functions — the privileged paths. SECURITY DEFINER functions are the ONLY way to write
-- ballots and audit events (INV-4). Canonicalisation: complex payloads are canonicalised in
-- TypeScript (@ecclesia/audit) and passed in; flat scalar payloads use ballotbox.jcs_flat below.
-- The standalone verifier re-canonicalises every payload and recomputes every hash, so any
-- divergence fails closed (INV-6).

-- ---------------------------------------------------------------------------
-- Minimal JCS for FLAT scalar objects (RFC 8785 subset): sort keys, no whitespace.
-- Sufficient for all SQL-originated audit payloads (ballot hashes, counts, transitions), which
-- are flat ASCII objects. A pgTAP vector test pins its output to the TypeScript canonicaliser.
-- ---------------------------------------------------------------------------
create or replace function ballotbox.jcs_scalar(v jsonb) returns text
language plpgsql immutable as $$
declare t text := jsonb_typeof(v);
begin
  if v is null or t = 'null' then
    return 'null';
  elsif t = 'boolean' then
    return v::text;
  elsif t = 'number' then
    if (v::text) ~ '[.eE]' then
      raise exception 'jcs: non-integer numbers are not allowed (got %)', v::text;
    end if;
    return v::text;
  elsif t = 'string' then
    return to_json(v #>> '{}')::text; -- JSON-escaped string == JSON.stringify for ASCII payloads
  else
    raise exception 'jcs_scalar: expected a scalar, got %', t;
  end if;
end$$;

create or replace function ballotbox.jcs_flat(p jsonb) returns text
language plpgsql immutable as $$
declare k text; parts text[] := '{}';
begin
  if jsonb_typeof(p) <> 'object' then
    raise exception 'jcs_flat expects a flat object';
  end if;
  for k in select key from jsonb_each(p) order by key collate "C" loop
    parts := parts || (to_json(k)::text || ':' || ballotbox.jcs_scalar(p -> k));
  end loop;
  return '{' || array_to_string(parts, ',') || '}';
end$$;

-- ---------------------------------------------------------------------------
-- The one audit-event insert path (§4.2). previous_event_hash chains; genesis = sha256(election).
--   event_hash = sha256( previous || canonical_payload || event_type || iso8601(created_at) )
-- ---------------------------------------------------------------------------
create or replace function ballotbox.write_audit_event(
  p_election uuid,
  p_org uuid,
  p_type text,
  p_payload jsonb,
  p_canonical text,
  p_created timestamptz default now()
) returns ballotbox.audit_events
language plpgsql
security definer
set search_path = ballotbox, public
as $$
declare
  v_prev text;
  v_iso text;
  v_hash text;
  v_row ballotbox.audit_events;
begin
  select event_hash into v_prev
    from ballotbox.audit_events
   where election_id is not distinct from p_election
   order by id desc
   limit 1;
  if v_prev is null then
    v_prev := encode(digest(coalesce(p_election::text, ''), 'sha256'), 'hex'); -- genesis
  end if;
  v_iso := to_char(p_created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_hash := encode(digest(v_prev || p_canonical || p_type || v_iso, 'sha256'), 'hex');
  insert into ballotbox.audit_events
    (election_id, organisation_id, event_type, event_payload, event_hash, previous_event_hash, created_at)
  values (p_election, p_org, p_type, p_payload, v_hash, v_prev, p_created)
  returning * into v_row;
  return v_row;
end$$;

alter function ballotbox.write_audit_event(uuid, uuid, text, jsonb, text, timestamptz)
  owner to ecclesia_ballotbox_owner;

-- ---------------------------------------------------------------------------
-- Cast or replace a ballot (§6.1, redline Edit C / INV-3). The only ballot write path.
-- Retire the current ballot BEFORE inserting the new one, under a per-credential advisory lock,
-- so two current ballots never coexist even under concurrency. ballot_accepted (and
-- ballot_replaced) are logged atomically with bucketed timestamps (redline Edit D).
-- ---------------------------------------------------------------------------
create or replace function ballotbox.cast_or_replace_ballot(
  p_election uuid,
  p_org uuid,
  p_public_credential text,
  p_payload jsonb,
  p_payload_canonical text, -- JCS(payload) from the caller; ballot_hash = sha256(this)
  p_receipt text,
  p_anonymous_ballot_id text,
  p_allow_revote boolean,
  p_accepted_at timestamptz default now()
) returns ballotbox.ballots
language plpgsql
security definer
set search_path = ballotbox, public
as $$
declare
  v_old ballotbox.ballots;
  v_new ballotbox.ballots;
  v_hash text;
  v_bucket timestamptz := date_trunc('hour', p_accepted_at)
    + floor(date_part('minute', p_accepted_at) / 10) * interval '10 minutes';
begin
  if not exists (
    select 1 from ballotbox.election_credentials c
     where c.election_id = p_election
       and c.public_credential = p_public_credential
       and c.status = 'active'
  ) then
    raise exception 'credential not eligible for this election';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_election::text || ':' || p_public_credential, 0));

  v_hash := encode(digest(p_payload_canonical, 'sha256'), 'hex');

  select * into v_old
    from ballotbox.ballots
   where election_id = p_election
     and public_credential = p_public_credential
     and is_replaced = false
   for update;

  if found then
    if not p_allow_revote then
      raise exception 're-voting is disabled and a ballot already exists for this credential';
    end if;
    update ballotbox.ballots set is_replaced = true where id = v_old.id; -- retire first (INV-3)
  end if;

  insert into ballotbox.ballots
    (election_id, anonymous_ballot_id, public_credential, encrypted_vote_payload,
     ballot_hash, receipt_phrase, accepted_at)
  values
    (p_election, p_anonymous_ballot_id, p_public_credential, p_payload,
     v_hash, p_receipt, v_bucket)
  returning * into v_new;

  if v_old.id is not null then
    update ballotbox.ballots set replaced_by_ballot_id = v_new.id where id = v_old.id;
    perform ballotbox.write_audit_event(
      p_election, p_org, 'ballot_replaced',
      jsonb_build_object('oldBallotHash', v_old.ballot_hash, 'newBallotHash', v_hash),
      ballotbox.jcs_flat(jsonb_build_object('oldBallotHash', v_old.ballot_hash, 'newBallotHash', v_hash)),
      v_bucket
    );
  end if;

  perform ballotbox.write_audit_event(
    p_election, p_org, 'ballot_accepted',
    jsonb_build_object('ballotHash', v_hash),
    ballotbox.jcs_flat(jsonb_build_object('ballotHash', v_hash)),
    v_bucket
  );

  return v_new;
end$$;

alter function ballotbox.cast_or_replace_ballot(uuid, uuid, text, jsonb, text, text, text, boolean, timestamptz)
  owner to ecclesia_ballotbox_owner;

-- ---------------------------------------------------------------------------
-- Identity-zone RPCs (§3.3). The cast Edge Function calls check_eligibility (boolean only) then,
-- after the ballot is written, mark_voted. Neither returns or stores any credential value.
-- ---------------------------------------------------------------------------
create or replace function identity.check_eligibility(p_election uuid, p_voter uuid)
returns boolean
language sql
stable
security definer
set search_path = identity, public
as $$
  select exists (
    select 1
      from identity.election_eligibility e
      join identity.voters v on v.id = e.voter_id
     where e.election_id = p_election
       and e.voter_id = p_voter
       and e.credential_status = 'issued'
       and v.status = 'active'
  );
$$;

create or replace function identity.mark_voted(p_election uuid, p_voter uuid, p_voted_at timestamptz default now())
returns void
language plpgsql
security definer
set search_path = identity, public
as $$
declare
  v_bucket timestamptz := date_trunc('hour', p_voted_at)
    + floor(date_part('minute', p_voted_at) / 10) * interval '10 minutes';
begin
  update identity.election_eligibility
     set has_voted = true,
         has_voted_bucket = v_bucket -- 10-minute bucket (redline Edit D)
   where election_id = p_election and voter_id = p_voter;
end$$;

-- ---------------------------------------------------------------------------
-- Election state machine (§4.1, WP-04). Mirrors @ecclesia/shared ELECTION_TRANSITIONS exactly.
-- ---------------------------------------------------------------------------
create or replace function identity.is_valid_transition(p_from text, p_to text)
returns boolean
language sql
immutable
as $$
  select (p_from, p_to) in (
    ('draft', 'discussion'), ('draft', 'open'), ('draft', 'archived'),
    ('discussion', 'open'), ('discussion', 'archived'),
    ('open', 'closed'),
    ('closed', 'tallied'),
    ('tallied', 'published'),
    ('published', 'archived')
  );
$$;

create or replace function identity.transition_election(
  p_election uuid,
  p_to text,
  p_actor uuid,
  p_reason text default null,
  p_override boolean default false
) returns identity.elections
language plpgsql
security definer
set search_path = identity, public
as $$
declare
  v_from text;
  v_org uuid;
  v_row identity.elections;
begin
  select status, organisation_id into v_from, v_org
    from identity.elections where id = p_election for update;
  if v_from is null then raise exception 'election % not found', p_election; end if;

  if not identity.is_valid_transition(v_from, p_to) then
    if not p_override then
      raise exception 'illegal transition % -> %', v_from, p_to;
    end if;
    -- §9.2: an override is always recorded, with actor and reason, atomically.
    perform ballotbox.write_audit_event(
      p_election, v_org, 'admin_override',
      jsonb_build_object('from', v_from, 'to', p_to, 'actor', p_actor::text, 'reason', coalesce(p_reason, '')),
      ballotbox.jcs_flat(jsonb_build_object('from', v_from, 'to', p_to, 'actor', p_actor::text, 'reason', coalesce(p_reason, ''))),
      now()
    );
  end if;

  update identity.elections set status = p_to where id = p_election returning * into v_row;
  return v_row;
end$$;
