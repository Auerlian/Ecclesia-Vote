import type { ElectionStatus } from "./enums";

/**
 * Election lifecycle (§4.1, WP-04). This table is the single source of truth; the Postgres
 * transition function (WP-04) mirrors it exactly, and the wizard/admin UI consult it so the
 * client never offers an illegal transition.
 *
 * Normal flow: draft -> discussion -> open -> closed -> tallied -> published -> archived.
 * - discussion is optional (draft -> open is allowed).
 * - open -> closed is the one-way close (INV-8). Re-opening a closed election is NOT in this
 *   table: it requires a super-admin override that writes an `admin_override` audit event (§9.2).
 * - archived is terminal.
 */
export const ELECTION_TRANSITIONS: Readonly<Record<ElectionStatus, readonly ElectionStatus[]>> = {
  draft: ["discussion", "open", "archived"],
  discussion: ["open", "archived"],
  open: ["closed"],
  closed: ["tallied"],
  tallied: ["published"],
  published: ["archived"],
  archived: [],
};

/** True iff `to` is a legal *normal* successor of `from` (override path excluded by design). */
export function isValidTransition(from: ElectionStatus, to: ElectionStatus): boolean {
  return ELECTION_TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: ElectionStatus): readonly ElectionStatus[] {
  return ELECTION_TRANSITIONS[from];
}

/** Statuses in which the public board / receipt search is meaningful. */
export function isBoardVisible(status: ElectionStatus): boolean {
  return status === "open" || status === "closed" || status === "tallied" || status === "published";
}

/** Statuses in which results may be published (after close). */
export function areResultsPublished(status: ElectionStatus): boolean {
  return status === "published";
}
