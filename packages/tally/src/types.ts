import type { Selection, VoteType } from "@ecclesia/shared";

/**
 * Tally input. `selections` must already exclude replaced ballots (INV-3) — the DB view and the
 * audit bundle do this before calling. The tally itself is pure and stateless.
 */
export interface TallyInput {
  voteType: VoteType;
  /** Ordered option ids for multiple_choice / approval. Ignored for yes_no. */
  optionIds: readonly string[];
  /** One selection per counted ballot. */
  selections: readonly Selection[];
}

export interface OptionTally {
  optionId: string;
  votes: number;
}

/**
 * Canonical, JSON-serialisable tally result. `options` is sorted by optionId ascending so the
 * standalone verifier recomputes byte-identical output (INV-6). The result hash published in the
 * bundle is sha256(JCS(this)).
 *
 * Conservation:
 *  - yes_no / multiple_choice (partition):  Σ options.votes + abstain + spoiled === accepted
 *  - approval (non-partition):              effectiveBallots + abstain + spoiled === accepted
 *    (options.votes may sum to more than accepted, since a ballot can approve several options)
 */
export interface TallyResult {
  voteType: VoteType;
  accepted: number;
  abstain: number;
  spoiled: number;
  /** Ballots that expressed a valid, non-abstain selection. */
  effectiveBallots: number;
  options: OptionTally[];
}
