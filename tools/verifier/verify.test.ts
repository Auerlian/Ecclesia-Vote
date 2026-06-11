import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeBundleDir } from "@ecclesia/audit";
import { MockEngine, sampleMultipleChoiceConfig } from "@ecclesia/ballot-engine";
import { describe, expect, it } from "vitest";
// @ts-expect-error — plain ESM JS module, intentionally untyped (zero-dep standalone tool).
import { verifyBundle } from "./ecclesia-verify.mjs";

const VERIFIER = fileURLToPath(new URL("./ecclesia-verify.mjs", import.meta.url));

async function buildBundleDir(): Promise<string> {
  const engine = new MockEngine();
  const cfg = sampleMultipleChoiceConfig("66666666-6666-6666-6666-666666666666");
  const ref = await engine.createElection(cfg);
  const batch = await engine.issueCredentials(ref, 5);
  const enc = await engine.getClientEncryptor(ref);
  const opt = cfg.options.map((o) => o.optionId);
  const sign = (publicCredential: string, encrypted: ReturnType<typeof enc.encrypt>) => ({
    publicCredential,
    signature: "mock",
    encrypted,
  });

  const c0 = batch.credentials[0]!.publicCredential;
  const c1 = batch.credentials[1]!.publicCredential;
  const c2 = batch.credentials[2]!.publicCredential;

  await engine.castBallot(ref, sign(c0, enc.encrypt({ kind: "single", optionId: opt[0]! })));
  await engine.castBallot(ref, sign(c1, enc.encrypt({ kind: "single", optionId: opt[1]! })));
  await engine.castBallot(ref, sign(c2, enc.encrypt({ kind: "abstain" })));
  // c0 re-votes -> its first ballot is replaced and excluded from the tally
  await engine.castBallot(ref, sign(c0, enc.encrypt({ kind: "single", optionId: opt[2]! })));

  const bundle = await engine.buildVerificationArtifacts(ref);
  const dir = mkdtempSync(join(tmpdir(), "ecclesia-bundle-"));
  writeBundleDir(dir, bundle);
  return dir;
}

describe("ecclesia-verify (standalone, zero app-code deps)", () => {
  it("verifies a clean MockEngine bundle in-process", async () => {
    const dir = await buildBundleDir();
    const { ok, checks } = verifyBundle(dir);
    expect(checks.every((c: { ok: boolean }) => c.ok), JSON.stringify(checks, null, 2)).toBe(true);
    expect(ok).toBe(true);
  });

  it("exits 0 on a clean bundle when run as a CLI", async () => {
    const dir = await buildBundleDir();
    const out = execFileSync("node", [VERIFIER, dir], { encoding: "utf8" });
    expect(out).toContain("OK — every check passed.");
  });

  it("exits non-zero and names the failing check when a ballot is tampered", async () => {
    const dir = await buildBundleDir();
    const ballotsPath = join(dir, "ballots.json");
    const ballots = JSON.parse(readFileSync(ballotsPath, "utf8"));
    const victim = ballots.find((b: { isReplaced: boolean }) => !b.isReplaced);
    victim.payload.selection = { kind: "single", optionId: "tampered-option" }; // hash no longer matches
    writeFileSync(ballotsPath, JSON.stringify(ballots, null, 2));

    const { ok, checks } = verifyBundle(dir);
    expect(ok).toBe(false);
    const failed = checks.filter((c: { ok: boolean }) => !c.ok).map((c: { name: string }) => c.name);
    expect(failed).toContain("ballot hashes valid");

    let exitCode = 0;
    let stdout = "";
    try {
      execFileSync("node", [VERIFIER, dir], { encoding: "utf8" });
    } catch (e) {
      const err = e as { status: number; stdout: string };
      exitCode = err.status;
      stdout = err.stdout;
    }
    expect(exitCode).toBe(1);
    expect(stdout).toContain("FAIL  ballot hashes valid");
  });

  it("detects a broken audit chain", async () => {
    const dir = await buildBundleDir();
    const chainPath = join(dir, "audit_chain.json");
    const chain = JSON.parse(readFileSync(chainPath, "utf8"));
    chain[0].payload = { tampered: true };
    writeFileSync(chainPath, JSON.stringify(chain, null, 2));
    const { ok, checks } = verifyBundle(dir);
    expect(ok).toBe(false);
    expect(checks.find((c: { name: string }) => c.name === "audit hash chain intact")!.ok).toBe(false);
  });
});
