-- 0006_grants_rls — role grants and RLS that enforce the invariants in the database itself
-- (INV-1, INV-4, INV-10), not in application logic. pgTAP (supabase/tests) asserts every line here.

-- ===========================================================================
-- BALLOT BOX ZONE
-- ===========================================================================

-- INV-4: ballots are append-only. NOBODY gets UPDATE/DELETE except the SECURITY DEFINER
-- transition function (which runs as ecclesia_ballotbox_owner).
revoke all on ballotbox.ballots from public, anon, authenticated, app_identity, app_ballotbox;
revoke all on ballotbox.audit_events from public, anon, authenticated, app_identity, app_ballotbox;
revoke all on ballotbox.election_credentials from public, anon, authenticated, app_identity;
revoke all on ballotbox.audited_ballots from public, anon, authenticated, app_identity;

-- Server-side reads for tally / bundle building (no write):
grant select on ballotbox.ballots to app_ballotbox;
grant select on ballotbox.audit_events to app_ballotbox;
grant select on ballotbox.election_credentials to app_ballotbox;
grant select on ballotbox.audited_ballots to app_ballotbox;
grant insert on ballotbox.election_credentials to app_ballotbox; -- credential-set issuance
grant insert on ballotbox.audited_ballots to app_ballotbox; -- Benaloh reveals

-- The definer identity needs the privileges the functions exercise:
grant select, insert, update on ballotbox.ballots to ecclesia_ballotbox_owner;
grant select, insert on ballotbox.audit_events to ecclesia_ballotbox_owner;
grant select on ballotbox.election_credentials to ecclesia_ballotbox_owner;

-- INV-2 / Edit B: the public board view (receipt_phrase + is_replaced only) is the ONLY public
-- read into the ballot box. The view runs with its owner's rights, exposing just those columns;
-- anon/authenticated have no grant on the base ballots table at all.
grant select on ballotbox.public_board to anon, authenticated;

-- Function execute: privileged ballot/audit writers are callable ONLY by trusted server roles,
-- never by the browser (anon/authenticated) — otherwise authenticated could forge audit events.
revoke all on function ballotbox.write_audit_event(uuid, uuid, text, jsonb, text, timestamptz) from public;
revoke all on function ballotbox.cast_or_replace_ballot(uuid, uuid, text, jsonb, text, text, text, boolean, timestamptz) from public;
grant execute on function ballotbox.write_audit_event(uuid, uuid, text, jsonb, text, timestamptz)
  to app_ballotbox, app_identity, service_role;
grant execute on function ballotbox.cast_or_replace_ballot(uuid, uuid, text, jsonb, text, text, text, boolean, timestamptz)
  to app_ballotbox, service_role;

-- ===========================================================================
-- CREDENTIAL-AUTHORITY ZONE (redline Edit A / INV-1)
-- The voter<->credential map is readable by app_credauth ONLY. The application zones cannot see it.
-- ===========================================================================
revoke all on credauth.credential_assignments from public, anon, authenticated, app_identity, app_ballotbox;
grant select, insert, update on credauth.credential_assignments to app_credauth;
-- The cast function may resolve voter->credential at cast time (the one brief cross-zone touch):
grant execute on function ballotbox.cast_or_replace_ballot(uuid, uuid, text, jsonb, text, text, text, boolean, timestamptz)
  to app_credauth;

-- ===========================================================================
-- IDENTITY ZONE — RLS for the admin UI (authenticated via PostgREST)
-- ===========================================================================
create or replace function identity.is_org_member(p_org uuid)
returns boolean language sql stable security definer set search_path = identity, public as $$
  select exists (
    select 1 from identity.organisation_members m
     where m.organisation_id = p_org and m.user_id = auth.uid()
  );
$$;

create or replace function identity.is_org_admin(p_org uuid)
returns boolean language sql stable security definer set search_path = identity, public as $$
  select exists (
    select 1 from identity.organisation_members m
     where m.organisation_id = p_org and m.user_id = auth.uid()
       and m.role in ('owner', 'admin')
  );
$$;

alter table identity.organisations enable row level security;
alter table identity.organisation_members enable row level security;
alter table identity.voters enable row level security;
alter table identity.elections enable row level security;
alter table identity.election_options enable row level security;
alter table identity.election_eligibility enable row level security;

-- Organisations: members read; a signed-in user may create one they own.
create policy org_select on identity.organisations
  for select to authenticated using (identity.is_org_member(id));
create policy org_insert on identity.organisations
  for insert to authenticated with check (created_by = auth.uid());
create policy org_admin_update on identity.organisations
  for update to authenticated using (identity.is_org_admin(id)) with check (identity.is_org_admin(id));

-- Membership rows: visible to fellow members.
create policy members_select on identity.organisation_members
  for select to authenticated using (identity.is_org_member(organisation_id));

-- Voters carry PII: visible to org admins/owners ONLY (invisible to members/observers).
create policy voters_admin_all on identity.voters
  for all to authenticated
  using (identity.is_org_admin(organisation_id))
  with check (identity.is_org_admin(organisation_id));

-- Elections: any member reads; admins write.
create policy elections_select on identity.elections
  for select to authenticated using (identity.is_org_member(organisation_id));
create policy elections_admin_write on identity.elections
  for all to authenticated
  using (identity.is_org_admin(organisation_id))
  with check (identity.is_org_admin(organisation_id));

create policy options_select on identity.election_options
  for select to authenticated using (
    exists (select 1 from identity.elections e where e.id = election_id and identity.is_org_member(e.organisation_id))
  );
create policy options_admin_write on identity.election_options
  for all to authenticated
  using (exists (select 1 from identity.elections e where e.id = election_id and identity.is_org_admin(e.organisation_id)))
  with check (exists (select 1 from identity.elections e where e.id = election_id and identity.is_org_admin(e.organisation_id)));

-- Per-voter eligibility rows: admins only. Turnout is read via the aggregate view.
create policy eligibility_admin on identity.election_eligibility
  for all to authenticated
  using (exists (select 1 from identity.elections e where e.id = election_id and identity.is_org_admin(e.organisation_id)))
  with check (exists (select 1 from identity.elections e where e.id = election_id and identity.is_org_admin(e.organisation_id)));

-- Base grants (RLS filters these for authenticated; app_identity is the trusted server zone).
grant select, insert, update on identity.organisations to authenticated;
grant select on identity.organisation_members to authenticated;
grant select, insert, update on identity.voters to authenticated;
grant select, insert, update on identity.elections to authenticated;
grant select, insert, update on identity.election_options to authenticated;
grant select, insert, update on identity.election_eligibility to authenticated;
grant select on identity.turnout to authenticated;

grant select, insert, update on all tables in schema identity to app_identity;

grant execute on function identity.check_eligibility(uuid, uuid) to app_ballotbox, app_credauth, service_role;
grant execute on function identity.mark_voted(uuid, uuid, timestamptz) to app_ballotbox, app_credauth, service_role;
grant execute on function identity.transition_election(uuid, text, uuid, text, boolean) to authenticated, service_role;
