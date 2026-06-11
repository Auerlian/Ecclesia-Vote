-- T-INV-1, INV-10, redline Edit A & B — zone separation and column-level non-linkage.
begin;
select plan(13);

-- T-INV-1 / Edit A: there is no column-level join path from identity to a credential.
select hasnt_column(
  'identity', 'election_eligibility', 'public_credential',
  'INV-1/Edit A: election_eligibility has NO public_credential column'
);
select has_column(
  'ballotbox', 'election_credentials', 'public_credential',
  'the public credential set lives in the ballotbox zone, keyed by election only'
);

-- Zone separation enforced by GRANTS (not application logic).
set role app_identity;
select throws_ok('select 1 from ballotbox.ballots', '42501', null,
  'app_identity cannot read ballotbox.ballots');
select throws_ok('select 1 from ballotbox.audit_events', '42501', null,
  'app_identity cannot read ballotbox.audit_events');
select throws_ok('select 1 from credauth.credential_assignments', '42501', null,
  'app_identity cannot read the credauth zone');
reset role;

set role app_ballotbox;
select throws_ok('select 1 from identity.voters', '42501', null,
  'app_ballotbox cannot read identity.voters');
select throws_ok('select 1 from identity.election_eligibility', '42501', null,
  'app_ballotbox cannot read identity eligibility');
select throws_ok('select 1 from credauth.credential_assignments', '42501', null,
  'app_ballotbox cannot read the credauth zone');
reset role;

-- INV-10: an admin (authenticated, via PostgREST) has no read path to a vote choice.
set role authenticated;
select throws_ok('select encrypted_vote_payload from ballotbox.ballots', '42501', null,
  'INV-10: authenticated cannot read encrypted_vote_payload');
select throws_ok('select 1 from ballotbox.ballots', '42501', null,
  'authenticated cannot read the base ballots table at all');
reset role;

-- Edit B: the public board exposes inclusion data only.
select has_column('ballotbox', 'public_board', 'receipt_phrase', 'board exposes receipt_phrase');
select hasnt_column('ballotbox', 'public_board', 'ballot_hash', 'Edit B: board has NO ballot_hash');
select hasnt_column('ballotbox', 'public_board', 'encrypted_vote_payload',
  'Edit B: board has NO payload');

select * from finish();
rollback;
