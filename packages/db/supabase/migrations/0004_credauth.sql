-- 0004_credauth — credential-authority zone (§3.5, redline Edit A).
--
-- Holds the ONLY voter<->public_credential mapping. Readable solely by app_credauth (and, at cast
-- time, the SECURITY DEFINER cast function). app_identity and app_ballotbox get NO grant here, so
-- an admin acting through either application role cannot join identity to vote.
--
-- v0.1 residual, documented in docs/threat-model.md: a DB SUPERUSER can still join across schemas
-- — this is exactly the Belenios credential-authority trust assumption, now isolated to this zone
-- instead of sitting in the identity table. v0.2 moves this zone to a separate deployment, after
-- which ballot secrecy holds even against a fully compromised voting server.
create table credauth.credential_assignments (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null,
  voter_id uuid not null,
  public_credential text not null,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (election_id, voter_id),
  unique (election_id, public_credential)
);
