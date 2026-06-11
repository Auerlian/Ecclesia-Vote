import type { Selection } from "@ecclesia/shared";
import { describe, expect, it } from "vitest";
import { isSuppressed, selectionsOfCounted, tally } from "./tally";

function votes(result: ReturnType<typeof tally>, optionId: string): number {
  return result.options.find((o) => o.optionId === optionId)?.votes ?? 0;
}

describe("yes_no tally", () => {
  it("counts yes / no / abstain and conserves", () => {
    const selections: Selection[] = [
      { kind: "yes_no", value: "yes" },
      { kind: "yes_no", value: "yes" },
      { kind: "yes_no", value: "no" },
      { kind: "abstain" },
    ];
    const r = tally({ voteType: "yes_no", optionIds: [], selections });
    expect(votes(r, "yes")).toBe(2);
    expect(votes(r, "no")).toBe(1);
    expect(r.abstain).toBe(1);
    expect(r.spoiled).toBe(0);
    expect(votes(r, "yes") + votes(r, "no") + r.abstain + r.spoiled).toBe(r.accepted);
  });

  it("treats a wrong-shape selection as spoiled", () => {
    const r = tally({
      voteType: "yes_no",
      optionIds: [],
      selections: [{ kind: "single", optionId: "x" } as Selection],
    });
    expect(r.spoiled).toBe(1);
  });
});

describe("multiple_choice tally", () => {
  it("partitions across options + abstain + spoiled", () => {
    const selections: Selection[] = [
      { kind: "single", optionId: "a" },
      { kind: "single", optionId: "b" },
      { kind: "single", optionId: "a" },
      { kind: "single", optionId: "ghost" }, // not a real option -> spoiled
      { kind: "abstain" },
    ];
    const r = tally({ voteType: "multiple_choice", optionIds: ["a", "b", "c"], selections });
    expect(votes(r, "a")).toBe(2);
    expect(votes(r, "b")).toBe(1);
    expect(votes(r, "c")).toBe(0);
    expect(r.abstain).toBe(1);
    expect(r.spoiled).toBe(1);
    const sum = r.options.reduce((s, o) => s + o.votes, 0);
    expect(sum + r.abstain + r.spoiled).toBe(r.accepted);
  });
});

describe("approval tally", () => {
  it("allows multiple approvals; conserves on ballots, not on votes", () => {
    const selections: Selection[] = [
      { kind: "approval", optionIds: ["a", "b"] },
      { kind: "approval", optionIds: ["a"] },
      { kind: "approval", optionIds: ["a", "b", "c"] },
      { kind: "approval", optionIds: [] as string[] }, // empty -> spoiled
      { kind: "abstain" },
    ];
    const r = tally({ voteType: "approval", optionIds: ["a", "b", "c"], selections });
    expect(votes(r, "a")).toBe(3);
    expect(votes(r, "b")).toBe(2);
    expect(votes(r, "c")).toBe(1);
    expect(r.abstain).toBe(1);
    expect(r.spoiled).toBe(1);
    expect(r.effectiveBallots).toBe(3);
    // non-partition conservation:
    expect(r.effectiveBallots + r.abstain + r.spoiled).toBe(r.accepted);
  });

  it("dedupes repeated approvals within one ballot", () => {
    const r = tally({
      voteType: "approval",
      optionIds: ["a", "b"],
      selections: [{ kind: "approval", optionIds: ["a", "a", "b"] }],
    });
    expect(votes(r, "a")).toBe(1);
    expect(votes(r, "b")).toBe(1);
  });
});

describe("canonical ordering (INV-6)", () => {
  it("sorts options by id ascending regardless of input order", () => {
    const r = tally({
      voteType: "multiple_choice",
      optionIds: ["zeta", "alpha", "mu"],
      selections: [],
    });
    expect(r.options.map((o) => o.optionId)).toEqual(["alpha", "mu", "zeta"]);
  });
});

describe("replaced ballots excluded (INV-3)", () => {
  it("selectionsOfCounted drops replaced rows", () => {
    const rows = [
      { isReplaced: true, selection: { kind: "yes_no", value: "yes" } as Selection },
      { isReplaced: false, selection: { kind: "yes_no", value: "no" } as Selection },
    ];
    const counted = selectionsOfCounted(rows);
    expect(counted).toHaveLength(1);
    const r = tally({ voteType: "yes_no", optionIds: [], selections: counted });
    expect(votes(r, "no")).toBe(1);
    expect(votes(r, "yes")).toBe(0);
  });
});

describe("conservation property (randomised)", () => {
  it("always conserves for every vote type", () => {
    const rnd = (n: number) => Math.floor(Math.random() * n);
    const optionIds = ["a", "b", "c", "d"];
    for (let trial = 0; trial < 500; trial++) {
      const n = rnd(60);
      const ynSel: Selection[] = [];
      const mcSel: Selection[] = [];
      const apSel: Selection[] = [];
      for (let i = 0; i < n; i++) {
        const roll = rnd(4);
        if (roll === 0) {
          ynSel.push({ kind: "abstain" });
          mcSel.push({ kind: "abstain" });
          apSel.push({ kind: "abstain" });
        } else {
          ynSel.push({ kind: "yes_no", value: rnd(2) ? "yes" : "no" });
          mcSel.push({ kind: "single", optionId: optionIds[rnd(4)]! });
          const k = 1 + rnd(3);
          apSel.push({ kind: "approval", optionIds: optionIds.slice(0, k) });
        }
      }
      const yn = tally({ voteType: "yes_no", optionIds: [], selections: ynSel });
      const mc = tally({ voteType: "multiple_choice", optionIds, selections: mcSel });
      const ap = tally({ voteType: "approval", optionIds, selections: apSel });

      expect(yn.options.reduce((s, o) => s + o.votes, 0) + yn.abstain + yn.spoiled).toBe(yn.accepted);
      expect(mc.options.reduce((s, o) => s + o.votes, 0) + mc.abstain + mc.spoiled).toBe(mc.accepted);
      expect(ap.effectiveBallots + ap.abstain + ap.spoiled).toBe(ap.accepted);
    }
  });
});

describe("INV-7 suppression boundary", () => {
  const threshold = 10;
  it("suppresses at n-1, shows at n and n+1", () => {
    expect(isSuppressed(9, threshold)).toBe(true);
    expect(isSuppressed(10, threshold)).toBe(false);
    expect(isSuppressed(11, threshold)).toBe(false);
  });
});
