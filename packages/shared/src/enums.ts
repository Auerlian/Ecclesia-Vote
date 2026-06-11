/**
 * Canonical enum value sets, shared by the client, Edge Functions, and tests.
 * Each is a frozen `as const` tuple so we get both a runtime list and a literal type.
 */

export const VOTE_TYPES = ["yes_no", "multiple_choice", "approval"] as const;
export type VoteType = (typeof VOTE_TYPES)[number];

export const ELECTION_STATUSES = [
  "draft",
  "discussion",
  "open",
  "closed",
  "tallied",
  "published",
  "archived",
] as const;
export type ElectionStatus = (typeof ELECTION_STATUSES)[number];

export const ORG_ROLES = ["owner", "admin", "member", "observer"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const VOTER_STATUSES = ["invited", "active", "removed"] as const;
export type VoterStatus = (typeof VOTER_STATUSES)[number];

export const CREDENTIAL_STATUSES = ["not_issued", "issued", "revoked"] as const;
export type CredentialStatus = (typeof CREDENTIAL_STATUSES)[number];

export const RESULTS_VISIBILITY = ["after_close", "live_non_secret"] as const;
export type ResultsVisibility = (typeof RESULTS_VISIBILITY)[number];

export const SECURITY_CLASSES = ["PROTOTYPE", "E2E_VERIFIABLE"] as const;
export type SecurityClass = (typeof SECURITY_CLASSES)[number];

/** Audit event types (§4.2). Ballot-level events carry hashes only, never identity. */
export const AUDIT_EVENT_TYPES = [
  "election_created",
  "election_published",
  "eligibility_imported",
  "credentials_issued",
  "voting_opened",
  "ballot_accepted",
  "ballot_replaced",
  "voting_closed",
  "tally_computed",
  "results_published",
  "admin_override",
] as const;
export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

/** Event types whose timestamps must be coarsened to the bucket (redline Edit D). */
export const BUCKETED_AUDIT_EVENT_TYPES: readonly AuditEventType[] = [
  "ballot_accepted",
  "ballot_replaced",
];
