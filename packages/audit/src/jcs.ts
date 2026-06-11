/**
 * RFC 8785 (JSON Canonicalization Scheme), restricted to the payload domain we actually use:
 *   string | boolean | null | INTEGER number | array | plain object.
 *
 * Non-integer or non-finite numbers throw on purpose — every canonicalised payload in this
 * system (election config, ballot selections, counts, hashes, ISO timestamps-as-strings) is
 * built from integers and strings, so we never need float canonicalisation. Keeping that rule
 * means the TypeScript canonicaliser, the Postgres hash-chain function, and the standalone
 * verifier are trivially identical (INV-6).
 *
 * String escaping defers to JSON.stringify, which already produces JCS-conformant output
 * (short escapes \b\f\n\r\t, lowercase \uXXXX, forward slash not escaped). Object keys are sorted
 * by UTF-16 code unit (JavaScript's default string comparison).
 */
export function canonicalize(value: unknown): string {
  return serialize(value);
}

function serialize(v: unknown): string {
  if (v === null) return "null";
  switch (typeof v) {
    case "boolean":
      return v ? "true" : "false";
    case "string":
      return JSON.stringify(v);
    case "number":
      return serializeNumber(v);
    case "object": {
      if (Array.isArray(v)) {
        return "[" + v.map((item) => serialize(item)).join(",") + "]";
      }
      const obj = v as Record<string, unknown>;
      const keys = Object.keys(obj)
        .filter((k) => obj[k] !== undefined)
        .sort();
      return "{" + keys.map((k) => JSON.stringify(k) + ":" + serialize(obj[k])).join(",") + "}";
    }
    default:
      throw new Error(`JCS: unsupported value type '${typeof v}'`);
  }
}

function serializeNumber(n: number): string {
  if (!Number.isFinite(n)) throw new Error("JCS: non-finite numbers are not allowed");
  if (!Number.isInteger(n)) {
    throw new Error("JCS: non-integer numbers are not allowed in canonical payloads");
  }
  if (Object.is(n, -0)) return "0";
  return String(n);
}
