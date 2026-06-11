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
      className="sticky top-0 z-50 border-b border-amber-600 bg-amber-400 px-4 py-2 text-center text-sm text-amber-950"
    >
      <strong>Prototype security</strong> · engine <code className="font-mono">{activeEngine.engineId}</code>{" "}
      (no real encryption yet). {PROTOTYPE_DISCLAIMER}
    </div>
  );
}
