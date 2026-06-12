import { createHash } from "node:crypto";

/**
 * Deterministic decorative mascot SVG derived from the receipt phrase (§5.1). It carries the
 * SAME information as the phrase — nothing more — and is purely visual. Pure function of the
 * phrase string; safe to render anywhere (no IO, no randomness).
 *
 * Visually this is "Ecco", the Ecclesia rosette mascot: every receipt gets its own little
 * Ecco with hash-picked colours, expression and accessory, on a soft badge background.
 */

const INK = "#232B49";
const PETALS = [
  "#3D6BFF",
  "#FF5C39",
  "#FFB81F",
  "#12B97E",
  "#8B4DFF",
  "#F83D8E",
  "#38BDF8",
  "#FB923C",
];
const BACKDROPS = [
  "#EEF4FF",
  "#FFF3F0",
  "#FFFAEB",
  "#ECFDF3",
  "#F6F2FF",
  "#FFF0F6",
  "#F0F9FF",
  "#FFF7ED",
];

/** Rosette outline: n petals of radius r centred on a ring of radius R around (cx, cy). */
function rosettePath(cx: number, cy: number, n: number, R: number, r: number): string {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const mid = ((i + 0.5) / n) * Math.PI * 2 - Math.PI / 2;
    const half = Math.PI / n;
    const h = Math.sqrt(r * r - R * R * Math.sin(half) ** 2);
    const d = R * Math.cos(half) + h;
    pts.push([cx + d * Math.cos(mid), cy + d * Math.sin(mid)]);
  }
  const last = pts[n - 1]!;
  let path = `M ${last[0]!.toFixed(2)} ${last[1]!.toFixed(2)}`;
  for (const [x, y] of pts) path += ` A ${r} ${r} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
  return path + " Z";
}

const HEAD = rosettePath(60, 50, 8, 24, 12.5);

function expression(pick: number): string {
  const stroke = `stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"`;
  if (pick === 1) {
    return (
      `<path d="M 48.5 48.5 Q 52 44 55.5 48.5" ${stroke}/>` +
      `<path d="M 64.5 48.5 Q 68 44 71.5 48.5" ${stroke}/>` +
      `<path d="M 52 57 Q 60 67 68 57 Z" fill="${INK}"/>`
    );
  }
  if (pick === 2) {
    return (
      `<circle cx="52" cy="48" r="2.8" fill="${INK}"/>` +
      `<path d="M 64.5 49 Q 68 45.5 71.5 49" ${stroke}/>` +
      `<path d="M 52 58 Q 60 65 68 58" ${stroke}/>`
    );
  }
  return (
    `<circle cx="52" cy="48" r="2.8" fill="${INK}"/>` +
    `<circle cx="68" cy="48" r="2.8" fill="${INK}"/>` +
    `<path d="M 52 58 Q 60 65 68 58" ${stroke}/>`
  );
}

function accessory(pick: number): string {
  switch (pick) {
    case 1: // graduation cap
      return (
        `<polygon points="60,2 88,13 60,24 32,13" fill="${INK}"/>` +
        `<path d="M 84 16 L 84 28" stroke="${INK}" stroke-width="2.5"/>` +
        `<circle cx="84" cy="30" r="3" fill="#FFB81F"/>`
      );
    case 2: // crown
      return `<path d="M 42 16 L 45 0 L 53 9 L 60 -4 L 67 9 L 75 0 L 78 16 Z" fill="#FFB81F" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
    case 3: // bow
      return (
        `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">` +
        `<path d="M 60 76 L 47 70 L 47 83 Z" fill="#FF5C39"/>` +
        `<path d="M 60 76 L 73 70 L 73 83 Z" fill="#FF5C39"/>` +
        `<circle cx="60" cy="76.5" r="4" fill="#FF5C39"/></g>`
      );
    case 4: // moustache
      return `<path d="M 60 56.5 C 55 52.5 48 54 46.5 59.5 C 51.5 62 57.5 60 60 56.5 C 62.5 60 68.5 62 73.5 59.5 C 72 54 65 52.5 60 56.5 Z" fill="${INK}"/>`;
    case 5: // glasses
      return (
        `<g fill="none" stroke="${INK}" stroke-width="2.5">` +
        `<circle cx="52" cy="48" r="7"/><circle cx="68" cy="48" r="7"/>` +
        `<path d="M 59 48 L 61 48"/><path d="M 45 47 L 40 45"/><path d="M 75 47 L 80 45"/></g>`
      );
    case 6: // flower
      return (
        `<g>` +
        [0, 72, 144, 216, 288]
          .map((a) => {
            const x = (86 + 6 * Math.cos((a * Math.PI) / 180)).toFixed(2);
            const y = (22 + 6 * Math.sin((a * Math.PI) / 180)).toFixed(2);
            return `<circle cx="${x}" cy="${y}" r="4" fill="#FF92C4" stroke="${INK}" stroke-width="2"/>`;
          })
          .join("") +
        `<circle cx="86" cy="22" r="3.5" fill="#FFB81F" stroke="${INK}" stroke-width="2"/></g>`
      );
    default: // none
      return "";
  }
}

export function mascotSvg(phrase: string, size = 96): string {
  const h = createHash("sha256").update(phrase).digest();
  const b = (i: number): number => h[i] ?? 0;

  const petal = PETALS[b(0) % PETALS.length]!;
  const backdrop = BACKDROPS[b(1) % BACKDROPS.length]!;
  const face = expression(b(2) % 3);
  const acc = accessory(b(3) % 7);
  const tilt = (b(4) % 11) - 5; // subtle head tilt, -5°..+5°

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 152" width="${size}" height="${size}" role="img" aria-label="Receipt mascot for ${phrase}">`,
    `<rect width="144" height="152" rx="28" fill="${backdrop}"/>`,
    `<g transform="translate(12 10) rotate(${tilt} 60 60)">`,
    // body: ribbon tails + curled hands
    `<path d="M 46 68 C 45.5 92 42 112 34 128 C 45 122 53 114 58 103 L 60 100 L 62 103 C 67 114 75 122 86 128 C 78 112 74.5 92 74 68 Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
    `<path d="M 37 72 C 33 83 36 93 46 98 C 48.5 99 50 97 49.5 95" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    `<path d="M 83 72 C 87 83 84 93 74 98 C 71.5 99 70 97 70.5 95" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    // rosette head + face
    `<path d="${HEAD}" fill="${petal}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
    `<circle cx="60" cy="52" r="22" fill="#fff" stroke="${INK}" stroke-width="3"/>`,
    face,
    acc,
    `</g>`,
    `</svg>`,
  ].join("");
}
