import { DEFAULT_MIN_AGGREGATE_N, type Selection } from "@ecclesia/shared";
import type { OptionTally, TallyInput, TallyResult } from "./types";

const YES_NO_OPTIONS = ["no", "yes"] as const; // sorted ascending for canonical output

/** Sort options by id ascending so output is byte-identical across implementations (INV-6). */
function sortOptions(options: OptionTally[]): OptionTally[] {
  return [...options].sort((a, b) => (a.optionId < b.optionId ? -1 : a.optionId > b.optionId ? 1 : 0));
}

/**
 * Reduce a list of selections to a canonical TallyResult. Pure and deterministic. Defensive
 * against malformed selections (counted as `spoiled`) even though the cast path validates them,
 * so the verifier and the server agree on edge cases.
 */
export function tally(input: TallyInput): TallyResult {
  const accepted = input.selections.length;
  let abstain = 0;
  let spoiled = 0;
  let effectiveBallots = 0;
  const counts = new Map<string, number>();

  const optionSet = new Set(input.optionIds);
  const bump = (id: string) => counts.set(id, (counts.get(id) ?? 0) + 1);

  if (input.voteType === "yes_no") {
    for (const id of YES_NO_OPTIONS) counts.set(id, 0);
  } else {
    for (const id of input.optionIds) counts.set(id, 0);
  }

  for (const sel of input.selections) {
    if (sel.kind === "abstain") {
      abstain++;
      continue;
    }
    switch (input.voteType) {
      case "yes_no": {
        if (sel.kind === "yes_no") {
          bump(sel.value);
          effectiveBallots++;
        } else {
          spoiled++;
        }
        break;
      }
      case "multiple_choice": {
        if (sel.kind === "single" && optionSet.has(sel.optionId)) {
          bump(sel.optionId);
          effectiveBallots++;
        } else {
          spoiled++;
        }
        break;
      }
      case "approval": {
        if (sel.kind === "approval") {
          const valid = sel.optionIds.filter((id) => optionSet.has(id));
          const unique = [...new Set(valid)];
          if (unique.length === 0) {
            spoiled++;
          } else {
            for (const id of unique) bump(id);
            effectiveBallots++;
          }
        } else {
          spoiled++;
        }
        break;
      }
    }
  }

  const options = sortOptions(
    [...counts.entries()].map(([optionId, votes]) => ({ optionId, votes })),
  );

  return { voteType: input.voteType, accepted, abstain, spoiled, effectiveBallots, options };
}

/**
 * INV-7: whether an aggregate of size `n` may be displayed/exported. Applies to subgroup
 * breakdowns and turnout slices, NOT the top-line whole-election result.
 */
export function isSuppressed(n: number, threshold: number = DEFAULT_MIN_AGGREGATE_N): boolean {
  return n < threshold;
}

/** Convenience: drop replaced ballots before tallying (INV-3). */
export function selectionsOfCounted<T extends { isReplaced: boolean; selection: Selection }>(
  ballots: readonly T[],
): Selection[] {
  return ballots.filter((b) => !b.isReplaced).map((b) => b.selection);
}
