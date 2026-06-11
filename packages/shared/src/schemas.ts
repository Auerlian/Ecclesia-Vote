import { z } from "zod";
import { RESULTS_VISIBILITY, VOTE_TYPES } from "./enums";

/** A single option as supplied by the election wizard (§4.1 election_options). */
export const electionOptionInputSchema = z
  .object({
    label: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    position: z.number().int().nonnegative(),
  })
  .strict();
export type ElectionOptionInput = z.infer<typeof electionOptionInputSchema>;

/**
 * Election configuration produced by the 7-step wizard (§10 page 3). Validated identically on
 * the client and in the Edge Function (§9.2). Windows are ISO strings; server time is
 * authoritative at enforcement (INV-8).
 */
export const electionConfigSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(10_000).optional(),
    voteType: z.enum(VOTE_TYPES),
    options: z.array(electionOptionInputSchema).max(100),
    allowAbstain: z.boolean().default(true),
    allowRevote: z.boolean().default(true),
    discussionOpensAt: z.string().datetime().optional(),
    votingOpensAt: z.string().datetime(),
    votingClosesAt: z.string().datetime(),
    resultsVisibility: z.enum(RESULTS_VISIBILITY).default("after_close"),
  })
  .strict()
  .refine((c) => new Date(c.votingClosesAt) > new Date(c.votingOpensAt), {
    message: "votingClosesAt must be after votingOpensAt",
    path: ["votingClosesAt"],
  })
  .refine((c) => c.voteType === "yes_no" || c.options.length >= 2, {
    message: "multiple_choice and approval require at least two options",
    path: ["options"],
  });
export type ElectionConfigInput = z.input<typeof electionConfigSchema>;
export type ElectionConfig = z.infer<typeof electionConfigSchema>;

/** One row of an imported voter CSV (§9.2). Email normalised; member id optional. */
export const csvVoterRowSchema = z
  .object({
    email: z
      .string()
      .email()
      .transform((s) => s.trim().toLowerCase()),
    display_name: z.string().max(200).optional(),
    external_member_id: z.string().max(100).optional(),
  })
  .strict();
export type CsvVoterRow = z.infer<typeof csvVoterRowSchema>;

/**
 * INV-2 / T-INV-2 — THE CLOSED SCHEMA.
 *
 * A receipt lookup may return inclusion status and replaced status only. This schema is
 * `.strict()`: any additional key (a choice, an option label, a ballot hash, anything) makes
 * validation fail. The receipt-search endpoint MUST validate its response against this before
 * sending, and a test asserts no other key can pass. Do not add fields here.
 */
export const RECEIPT_LOOKUP_STATUSES = ["included", "included_replaced", "not_found"] as const;
export type ReceiptLookupStatus = (typeof RECEIPT_LOOKUP_STATUSES)[number];

export const receiptLookupResponseSchema = z
  .object({
    status: z.enum(RECEIPT_LOOKUP_STATUSES),
  })
  .strict();
export type ReceiptLookupResponse = z.infer<typeof receiptLookupResponseSchema>;

/** Cast/audit request envelope. `selection` is validated separately with `selectionSchema`
 *  once the election's vote type and options are known (§6.1 steps 3–5). */
export const castIntentSchema = z
  .object({
    electionId: z.string().uuid(),
    intent: z.enum(["cast", "audit"]),
    selection: z.unknown(),
  })
  .strict();
export type CastIntent = z.infer<typeof castIntentSchema>;
