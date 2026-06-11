import { describe, expect, it } from "vitest";
import { mascotSvg } from "./mascot";

describe("mascotSvg", () => {
  it("is deterministic for a given phrase (same information content)", () => {
    const a = mascotSvg("silver-river-otter-4821");
    const b = mascotSvg("silver-river-otter-4821");
    expect(a).toBe(b);
  });

  it("differs across phrases", () => {
    expect(mascotSvg("silver-river-otter-4821")).not.toBe(mascotSvg("golden-peak-fox-1099"));
  });

  it("emits a self-contained SVG with no external references", () => {
    const svg = mascotSvg("silver-river-otter-4821");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
    expect(svg).not.toContain("http://www.w3.org/1999/xlink");
    expect(svg).not.toMatch(/href|src=/); // no remote fetches — CSP-friendly on ballot pages
  });
});
