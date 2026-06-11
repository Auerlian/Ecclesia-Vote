import { describe, expect, it } from "vitest";
import {
  ELECTION_STATUSES,
  ELECTION_TRANSITIONS,
  isValidTransition,
  receiptLookupResponseSchema,
  selectionSchema,
  truncateToBucket,
} from "./index";

describe("election state machine", () => {
  it("allows the canonical happy path", () => {
    expect(isValidTransition("draft", "open")).toBe(true);
    expect(isValidTransition("open", "closed")).toBe(true);
    expect(isValidTransition("closed", "tallied")).toBe(true);
    expect(isValidTransition("tallied", "published")).toBe(true);
  });

  it("treats close as one-way (no closed -> open without override)", () => {
    expect(isValidTransition("closed", "open")).toBe(false);
  });

  it("makes archived terminal", () => {
    expect(ELECTION_TRANSITIONS.archived).toHaveLength(0);
  });

  it("rejects every transition not in the table (exhaustive matrix)", () => {
    for (const from of ELECTION_STATUSES) {
      for (const to of ELECTION_STATUSES) {
        const legal = ELECTION_TRANSITIONS[from].includes(to);
        expect(isValidTransition(from, to)).toBe(legal);
      }
    }
  });
});

describe("receipt lookup closed schema (T-INV-2)", () => {
  it("accepts the three permitted statuses", () => {
    for (const status of ["included", "included_replaced", "not_found"] as const) {
      expect(receiptLookupResponseSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it("rejects ANY extra key — this is the coercion guard", () => {
    const leaky = { status: "included", choice: "yes" };
    expect(receiptLookupResponseSchema.safeParse(leaky).success).toBe(false);
  });

  it("rejects unknown status values", () => {
    expect(receiptLookupResponseSchema.safeParse({ status: "voted_yes" }).success).toBe(false);
  });
});

describe("selection schema", () => {
  it("validates yes/no and abstain, rejects unknown options", () => {
    const yn = selectionSchema("yes_no", [], true);
    expect(yn.safeParse({ kind: "yes_no", value: "yes" }).success).toBe(true);
    expect(yn.safeParse({ kind: "abstain" }).success).toBe(true);

    const mc = selectionSchema("multiple_choice", ["opt-a", "opt-b"], false);
    expect(mc.safeParse({ kind: "single", optionId: "opt-a" }).success).toBe(true);
    expect(mc.safeParse({ kind: "single", optionId: "ghost" }).success).toBe(false);
    expect(mc.safeParse({ kind: "abstain" }).success).toBe(false); // abstain disallowed
  });

  it("validates approval selections", () => {
    const ap = selectionSchema("approval", ["a", "b", "c"], true);
    expect(ap.safeParse({ kind: "approval", optionIds: ["a", "c"] }).success).toBe(true);
    expect(ap.safeParse({ kind: "approval", optionIds: [] }).success).toBe(false);
  });
});

describe("bucket truncation (timing mitigation)", () => {
  it("floors to the 10-minute boundary", () => {
    const d = new Date("2026-06-11T12:37:45.123Z");
    expect(truncateToBucket(d).toISOString()).toBe("2026-06-11T12:30:00.000Z");
  });
});
