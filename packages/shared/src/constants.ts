/** Platform-wide constants. Keep behaviour-defining numbers here, not scattered in code. */

/** INV-7: aggregates below this n are never displayed or exported. Org-overridable. */
export const DEFAULT_MIN_AGGREGATE_N = 10;

/** §3.3 / redline Edit D: identity has_voted and ballot audit timestamps are bucketed. */
export const HAS_VOTED_BUCKET_MINUTES = 10;

/** §5.1: bounded redraw loop on receipt collision. */
export const RECEIPT_MAX_REDRAWS = 16;

/** The disclaimer that must appear on every page and export of the v0.1 system (§1). */
export const PROTOTYPE_DISCLAIMER =
  "Prototype. Suitable for advisory and internal organisational votes only. " +
  "Not suitable for binding public elections.";

/** §9.1 authentication parameters. */
export const MAGIC_LINK_EXPIRY_MINUTES = 15;
export const MAGIC_LINK_RATE_LIMIT_PER_HOUR = 5;
export const SESSION_HOURS = 24;

/** §9.2 CSV import bounds. */
export const CSV_MAX_ROWS = 50_000;

/** §8: delegation graph walk depth cap (v0.3; constant defined now for shared use). */
export const DELEGATION_MAX_DEPTH = 8;

/** Engine identifiers (§3.4). */
export const ENGINE_IDS = {
  mock: "mock-v1",
  belenios: "belenios-v1",
  electionguard: "electionguard-v1",
} as const;
