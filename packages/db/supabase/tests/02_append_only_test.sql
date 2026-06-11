-- T-INV-4 — ballots and the audit log are append-only; only the SECURITY DEFINER writer mutates.
begin;
select plan(8);

-- No application role may UPDATE or DELETE ballots.
set role app_ballotbox;
select throws_ok('update ballotbox.ballots set is_replaced = true', '42501', null,
  'INV-4: app_ballotbox cannot UPDATE ballots');
select throws_ok('delete from ballotbox.ballots', '42501', null,
  'INV-4: app_ballotbox cannot DELETE ballots');
reset role;

set role authenticated;
select throws_ok('update ballotbox.ballots set is_replaced = true', '42501', null,
  'INV-4: authenticated cannot UPDATE ballots');
reset role;

-- No role may INSERT audit events directly — only via the definer writer.
set role app_ballotbox;
select throws_ok(
  $$insert into ballotbox.audit_events (event_type, event_payload, event_hash, previous_event_hash)
    values ('forged', '{}'::jsonb, 'x', 'y')$$,
  '42501', null,
  'INV-4: app_ballotbox cannot INSERT audit_events directly');

-- ...but the definer function appends (and chains) correctly.
select lives_ok(
  $$select ballotbox.write_audit_event(
      '99999999-9999-9999-9999-999999999999'::uuid, null, 'voting_opened',
      '{"a":1}'::jsonb, '{"a":1}', '2026-06-01T09:00:00.000Z'::timestamptz)$$,
  'app_ballotbox CAN append an audit event via write_audit_event');
select lives_ok(
  $$select ballotbox.write_audit_event(
      '99999999-9999-9999-9999-999999999999'::uuid, null, 'voting_closed',
      '{"a":2}'::jsonb, '{"a":2}', '2026-06-08T17:00:00.000Z'::timestamptz)$$,
  'appends a second event');
reset role;

-- The first event chains from genesis = sha256(election_id); the second chains from the first.
select is(
  (select previous_event_hash from ballotbox.audit_events
    where election_id = '99999999-9999-9999-9999-999999999999' order by id limit 1),
  encode(digest('99999999-9999-9999-9999-999999999999', 'sha256'), 'hex'),
  'first event chains from genesis = sha256(election_id)');

select is(
  (select previous_event_hash from ballotbox.audit_events
    where election_id = '99999999-9999-9999-9999-999999999999' order by id offset 1 limit 1),
  (select event_hash from ballotbox.audit_events
    where election_id = '99999999-9999-9999-9999-999999999999' order by id limit 1),
  'second event chains from the first event hash');

select * from finish();
rollback;
