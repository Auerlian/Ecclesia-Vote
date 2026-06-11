-- INV-3 (one current ballot per credential) + SQL JCS vectors that pin the canonicaliser.
begin;
select plan(9);

-- SQL flat-JCS must match the TypeScript canonicaliser (@ecclesia/audit) for flat ASCII objects.
select is(ballotbox.jcs_flat('{"b":1,"a":"x"}'::jsonb), '{"a":"x","b":1}',
  'jcs_flat sorts keys and quotes strings (matches JS canonicalize)');
select is(ballotbox.jcs_flat('{"ballotHash":"abc"}'::jsonb), '{"ballotHash":"abc"}',
  'jcs_flat single string field');
select throws_ok($$select ballotbox.jcs_flat('{"x":1.5}'::jsonb)$$, null, null,
  'jcs_flat rejects non-integer numbers (integer+string payloads only)');

-- INV-3: the partial unique index forbids two CURRENT ballots for one credential.
insert into ballotbox.election_credentials (election_id, public_credential)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cred-x');
insert into ballotbox.ballots
  (election_id, anonymous_ballot_id, public_credential, encrypted_vote_payload, ballot_hash, receipt_phrase)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ab1', 'cred-x', '{}'::jsonb, 'h1', 'amber-river-otter-1111');
select throws_ok(
  $$insert into ballotbox.ballots
     (election_id, anonymous_ballot_id, public_credential, encrypted_vote_payload, ballot_hash, receipt_phrase)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ab2', 'cred-x', '{}'::jsonb, 'h2', 'azure-peak-fox-2222')$$,
  '23505', null,
  'INV-3: a second current ballot for the same credential violates the partial unique index');

-- INV-3 via the cast function: revote replaces, never duplicates.
insert into ballotbox.election_credentials (election_id, public_credential)
  values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cred-y');
select lives_ok(
  $$select ballotbox.cast_or_replace_ballot(
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, null, 'cred-y',
      '{"engineId":"mock-v1","selection":{"kind":"yes_no","value":"yes"},"nonce":"n1"}'::jsonb,
      '{"engineId":"mock-v1","nonce":"n1","selection":{"kind":"yes_no","value":"yes"}}',
      'silver-river-otter-4821', 'aby1', true)$$,
  'cast via the definer function succeeds');
select is(
  (select count(*)::int from ballotbox.ballots
    where election_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and is_replaced = false),
  1, 'exactly one current ballot after the first cast');
select lives_ok(
  $$select ballotbox.cast_or_replace_ballot(
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, null, 'cred-y',
      '{"engineId":"mock-v1","selection":{"kind":"yes_no","value":"no"},"nonce":"n2"}'::jsonb,
      '{"engineId":"mock-v1","nonce":"n2","selection":{"kind":"yes_no","value":"no"}}',
      'golden-peak-fox-1099', 'aby2', true)$$,
  'a re-vote succeeds');
select is(
  (select count(*)::int from ballotbox.ballots
    where election_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and is_replaced = false),
  1, 'still exactly one current ballot after the re-vote (INV-3)');
select is(
  (select count(*)::int from ballotbox.ballots
    where election_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  2, 'the replaced ballot is retained (append-only)');

select * from finish();
rollback;
