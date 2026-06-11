# @ecclesia/db

Postgres schema, roles, RLS, SECURITY DEFINER functions, seed, and pgTAP tests for Ecclesia Vote.
This is where the redline security decisions are enforced **by the database**, not by app code.

## Layout

```
supabase/
  config.toml
  migrations/        # forward-only, numbered (0001…0006). The source of truth.
  seed.sql           # 1 org, 1 owner, 25 voters, a demo election (WP-01)
  tests/             # pgTAP — run with `supabase test db`
```

## The three zones (§3.3)

| Schema      | Role(s) with access            | Holds                                            |
|-------------|--------------------------------|--------------------------------------------------|
| `identity`  | `app_identity`, `authenticated` (RLS) | voters, eligibility, **has_voted** — never the vote |
| `ballotbox` | `app_ballotbox` (read), definer fns (write) | anonymous ballots, public credential **set**, audit log |
| `credauth`  | `app_credauth` **only**        | the sole voter ↔ public_credential mapping       |

## Redline fixes enforced here

- **Edit A / INV-1** — `election_eligibility` has **no** `public_credential` column; the set lives in
  `ballotbox.election_credentials` (keyed by election, no voter), and the voter↔credential map is
  isolated in `credauth`, readable by neither application zone. (`tests/01`)
- **Edit B / INV-2** — `ballotbox.public_board` exposes `receipt_phrase` + `is_replaced` only; no
  `ballot_hash`, no payload. (`tests/01`)
- **Edit C / INV-3** — `ballots_one_current_per_credential` partial unique index +
  `cast_or_replace_ballot` (retire-then-insert under an advisory lock). (`tests/03`)
- **Edit D** — `has_voted` and ballot audit-event timestamps are truncated to 10-minute buckets.
- **INV-4** — no app role has UPDATE/DELETE on `ballots`; only `write_audit_event` inserts audit
  events. (`tests/02`)
- **INV-10** — `authenticated` (admin via PostgREST) has no grant on the base `ballots` table, so it
  cannot read `encrypted_vote_payload`. (`tests/01`)

## Canonicalisation note

Complex audit payloads are canonicalised in TypeScript (`@ecclesia/audit`) and passed to
`write_audit_event`; flat scalar payloads use `ballotbox.jcs_flat`. The standalone verifier
re-canonicalises every payload and recomputes every hash, so any divergence fails closed (INV-6).
`tests/03` pins `jcs_flat` to the JS canonicaliser with fixed vectors.

## Run it

```bash
supabase start              # needs Docker
pnpm --filter @ecclesia/db db:reset    # apply migrations + seed
pnpm --filter @ecclesia/db db:test     # run pgTAP
```
