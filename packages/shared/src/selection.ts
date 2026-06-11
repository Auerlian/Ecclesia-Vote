import { z } from "zod";
import type { VoteType } from "./enums";

/**
 * Canonical, engine-independent representation of what a voter chose. The ballot engine wraps
 * this (in v0.1 MockEngine, as plaintext; in v0.2 Belenios, as ciphertext). The tally package
 * and the standalone verifier both reduce a list of Selections to a result — but the verifier
 * re-implements its own parser (it must not import app code), so this type is the *contract*,
 * not a shared dependency for the verifier.
 */
export type Selection =
  | { kind: "abstain" }
  | { kind: "yes_no"; value: "yes" | "no" }
  | { kind: "single"; optionId: string }
  | { kind: "approval"; optionIds: string[] };

const abstainSchema = z.object({ kind: z.literal("abstain") }).strict();

/**
 * Build a Zod schema for a Selection valid for a specific election. `optionIds` constrains
 * choices to real options; `allowAbstain` gates the abstain branch (§4.1 allow_abstain).
 */
export function selectionSchema(
  voteType: VoteType,
  optionIds: readonly string[],
  allowAbstain: boolean,
): z.ZodType<Selection> {
  const isOption = (id: string) => optionIds.includes(id);
  const optionRef = z.string().refine(isOption, { message: "unknown option id" });

  let active: z.ZodType<Selection>;
  switch (voteType) {
    case "yes_no":
      active = z
        .object({ kind: z.literal("yes_no"), value: z.enum(["yes", "no"]) })
        .strict() as z.ZodType<Selection>;
      break;
    case "multiple_choice":
      active = z
        .object({ kind: z.literal("single"), optionId: optionRef })
        .strict() as z.ZodType<Selection>;
      break;
    case "approval":
      active = z
        .object({ kind: z.literal("approval"), optionIds: z.array(optionRef).min(1) })
        .strict() as z.ZodType<Selection>;
      break;
  }

  if (!allowAbstain) return active;
  return z.union([active, abstainSchema as z.ZodType<Selection>]);
}
