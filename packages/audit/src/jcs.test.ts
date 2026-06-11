import { describe, expect, it } from "vitest";
import { canonicalize } from "./jcs";

describe("JCS canonicalize", () => {
  it("sorts object keys by code unit", () => {
    expect(canonicalize({ b: 1, a: 2, c: 3 })).toBe('{"a":2,"b":1,"c":3}');
  });

  it("is independent of input key order", () => {
    expect(canonicalize({ z: 1, a: 2 })).toBe(canonicalize({ a: 2, z: 1 }));
  });

  it("handles nesting and arrays without whitespace", () => {
    const v = { outer: { y: [3, 2, 1], x: "hi" }, list: [{ b: 2, a: 1 }] };
    expect(canonicalize(v)).toBe('{"list":[{"a":1,"b":2}],"outer":{"x":"hi","y":[3,2,1]}}');
  });

  it("escapes strings the JSON way (JCS-conformant)", () => {
    const s = 'a"b\n\t\\c/';
    expect(canonicalize(s)).toBe(JSON.stringify(s));
  });

  it("normalises -0 to 0 and serialises integers plainly", () => {
    expect(canonicalize(-0)).toBe("0");
    expect(canonicalize(42)).toBe("42");
    expect(canonicalize(-7)).toBe("-7");
  });

  it("rejects non-integer and non-finite numbers (payloads are integer+string only)", () => {
    expect(() => canonicalize(1.5)).toThrow();
    expect(() => canonicalize(Number.NaN)).toThrow();
    expect(() => canonicalize(Number.POSITIVE_INFINITY)).toThrow();
  });

  it("omits undefined object properties", () => {
    expect(canonicalize({ a: 1, b: undefined })).toBe('{"a":1}');
  });
});
