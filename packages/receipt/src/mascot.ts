import { createHash } from "node:crypto";

/**
 * Deterministic decorative mascot SVG derived from the receipt phrase (§5.1). It carries the
 * SAME information as the phrase — nothing more — and is purely visual. Pure function of the
 * phrase string; safe to render anywhere (no IO, no randomness).
 */
export function mascotSvg(phrase: string, size = 96): string {
  const h = createHash("sha256").update(phrase).digest();
  const b = (i: number): number => h[i] ?? 0;

  const hue1 = Math.round((b(0) / 255) * 360);
  const hue2 = Math.round((b(1) / 255) * 360);
  const accentHue = Math.round((b(2) / 255) * 360);
  const rot = Math.round((b(3) / 255) * 360);
  const eyeGap = 14 + (b(4) % 10);
  const mouthCurve = 6 + (b(5) % 10);
  const bg1 = `hsl(${hue1} 68% 46%)`;
  const bg2 = `hsl(${hue2} 60% 28%)`;
  const accent = `hsl(${accentHue} 85% 78%)`;
  const cx = 48;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="${size}" height="${size}" role="img" aria-label="Receipt mascot for ${phrase}">`,
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/>`,
    `</linearGradient></defs>`,
    `<rect width="96" height="96" rx="18" fill="url(#g)"/>`,
    `<g transform="rotate(${rot} 48 48)"><polygon points="48,18 56,40 80,40 60,54 68,78 48,64 28,78 36,54 16,40 40,40" fill="${accent}" opacity="0.35"/></g>`,
    `<circle cx="${cx}" cy="46" r="24" fill="#fff" opacity="0.92"/>`,
    `<circle cx="${cx - eyeGap / 2}" cy="42" r="3.5" fill="#1f2937"/>`,
    `<circle cx="${cx + eyeGap / 2}" cy="42" r="3.5" fill="#1f2937"/>`,
    `<path d="M ${cx - 9} 54 Q ${cx} ${54 + mouthCurve} ${cx + 9} 54" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    `</svg>`,
  ].join("");
}
