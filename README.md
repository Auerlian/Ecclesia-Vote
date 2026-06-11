# Ecclesia Vote

> **Prototype. Suitable for advisory and internal organisational votes only. Not suitable for binding public elections.**

A transparent, open-source platform for advisory votes, consultations, and member
decision-making, with end-to-end verifiability as the long-term differentiator.

Positioning: _Helios-grade integrity with Decidim-grade process, packaged for organisations
that cannot run either._

## Status

`v0.1` — **PROTOTYPE** security class. The active ballot engine (`MockEngine`) does **not**
perform real encryption; it exists to prove the UX and data flows. Every ballot/results page
carries a persistent prototype-security banner. Real end-to-end verifiability arrives in v0.2
via a network-isolated [Belenios](https://www.belenios.org/) service.

## What's in this repo

```
apps/web/                Next.js 15 app (all pages)
packages/
  shared/                Zod schemas, types, constants
  receipt/               CSPRNG receipt phrases + frozen wordlists + mascot SVG
  tally/                 Pure tally functions (yes/no, multiple choice, approval)
  audit/                 RFC 8785 JCS + hash chain + audit-bundle builder
  ballot-engine/         BallotEngine interface + MockEngine + conformance kit
  db/                    SQL migrations, roles, RLS, pgTAP, seed
tools/verifier/          Standalone `ecclesia-verify` CLI (zero deps on app code)
docs/                    Architecture, threat model, licences, verification guide
```

## Invariants

This codebase upholds ten hard invariants (see `docs/architecture.md` §2). The two that shape
the data model most:

- **INV-1** — no persisted join from voter identity to vote content. The credential ↔ voter map
  lives only in the isolated `credauth` zone; `public_credential` exists only in the `ballotbox`
  zone, never beside `voter_id`.
- **INV-2** — a receipt proves _inclusion only_. No public artifact links a receipt phrase to a
  ballot hash or payload, so a coercer who learns a receipt learns nothing about the vote.

## Quick start

```bash
pnpm install
pnpm test          # unit tests across all packages
pnpm typecheck
pnpm run db:reset  # requires the Supabase CLI; applies all migrations + seed
```

## Licence

Our code is Apache-2.0 (`LICENSE`). Third-party engine/process licences and how we comply with
them are recorded in `docs/licences.md`.
