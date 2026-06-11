import { describe, expect, it } from "vitest";
import {
  assertEngineConformance,
  MockEngine,
  sampleMultipleChoiceConfig,
  sampleYesNoConfig,
} from "./index";

describe("MockEngine", () => {
  it("passes the shared engine conformance suite (yes/no)", async () => {
    const report = await assertEngineConformance(new MockEngine(), sampleYesNoConfig());
    expect(report.checks.length).toBeGreaterThan(12);
  });

  it("passes the shared engine conformance suite (multiple choice)", async () => {
    await assertEngineConformance(new MockEngine(), sampleMultipleChoiceConfig());
  });

  it("is PROTOTYPE security class", () => {
    expect(new MockEngine().securityClass).toBe("PROTOTYPE");
  });

  it("rejects a re-vote when allowRevote is false", async () => {
    const engine = new MockEngine();
    const cfg = {
      ...sampleYesNoConfig("33333333-3333-3333-3333-333333333333"),
      allowRevote: false,
    };
    const ref = await engine.createElection(cfg);
    const batch = await engine.issueCredentials(ref, 1);
    const enc = await engine.getClientEncryptor(ref);
    const cred = batch.credentials[0]!;
    await engine.castBallot(ref, {
      publicCredential: cred.publicCredential,
      signature: "m",
      encrypted: enc.encrypt({ kind: "yes_no", value: "yes" }),
    });
    await expect(
      engine.castBallot(ref, {
        publicCredential: cred.publicCredential,
        signature: "m",
        encrypted: enc.encrypt({ kind: "yes_no", value: "no" }),
      }),
    ).rejects.toThrow();
  });

  it("excludes replaced ballots from the tally and the board shows both receipts", async () => {
    const engine = new MockEngine();
    const ref = await engine.createElection(sampleYesNoConfig("55555555-5555-5555-5555-555555555555"));
    const batch = await engine.issueCredentials(ref, 1);
    const enc = await engine.getClientEncryptor(ref);
    const cred = batch.credentials[0]!;
    await engine.castBallot(ref, {
      publicCredential: cred.publicCredential,
      signature: "m",
      encrypted: enc.encrypt({ kind: "yes_no", value: "yes" }),
    });
    await engine.castBallot(ref, {
      publicCredential: cred.publicCredential,
      signature: "m",
      encrypted: enc.encrypt({ kind: "yes_no", value: "no" }),
    });
    const bundle = await engine.buildVerificationArtifacts(ref);
    expect(bundle.board).toHaveLength(2); // both receipts visible
    expect(bundle.board.filter((b) => b.isReplaced)).toHaveLength(1); // one struck through
    expect(bundle.tally.accepted).toBe(1); // counted once
  });
});
