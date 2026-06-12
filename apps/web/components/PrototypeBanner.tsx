import { PROTOTYPE_DISCLAIMER } from "@ecclesia/shared";
import { activeEngine, isPrototype } from "@/lib/engine";

/**
 * Persistent prototype-security banner (WP-09). Rendered on every page via the root layout and
 * keyed off the active engine's securityClass — when v0.2 swaps in an E2E_VERIFIABLE engine, this
 * banner disappears automatically. INV: the §1 disclaimer appears on every page.
 */
export function PrototypeBanner() {
  if (!isPrototype) return null;
  return (
    <div
      role="alert"
      className="border-b border-sunshine-300 bg-sunshine-100 px-4 py-1.5 text-center text-[11px] font-bold leading-snug text-sunshine-800"
    >
      <span className="mr-1 rounded-full bg-sunshine-300/60 px-2 py-0.5 font-extrabold uppercase tracking-wide text-sunshine-900">
        Prototype
      </span>
      engine <code className="font-mono">{activeEngine.engineId}</code> — no real encryption yet.{" "}
      {PROTOTYPE_DISCLAIMER}
    </div>
  );
}
