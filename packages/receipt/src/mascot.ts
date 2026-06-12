import { createHash } from "node:crypto";

/**
 * Deterministic decorative mascot SVG derived from the receipt phrase (§5.1). It carries the
 * SAME information as the phrase — nothing more — and is purely visual. Pure function of the
 * phrase string; safe to render anywhere (no IO, no randomness, no external references).
 *
 * Visually this is "Ecco", the Ecclesia flux mascot: a liquid six-lobed droplet head with
 * diffused multicolour shading, animated with native SMIL (slow morph, blink). Every receipt
 * gets its own hash-picked colours, expression and accessory on a soft badge background.
 */

const INK = "#232B49";
const EASE3 = "0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1";

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
/** Each base colour diffuses into a partner and an accent: the flux trio. */
const FLUX: Record<string, { b: string; c: string }> = {
  "#3D6BFF": { b: "#8B4DFF", c: "#38BDF8" },
  "#FF5C39": { b: "#F83D8E", c: "#FFB81F" },
  "#FFB81F": { b: "#FF7A5C", c: "#FF92C4" },
  "#12B97E": { b: "#38BDF8", c: "#5B8AFF" },
  "#8B4DFF": { b: "#F83D8E", c: "#5B8AFF" },
  "#F83D8E": { b: "#A674FF", c: "#FF7A5C" },
  "#38BDF8": { b: "#36CE96", c: "#5B8AFF" },
  "#FB923C": { b: "#FF63A8", c: "#FFCB4A" },
};
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

// ---- liquid blob (mirrors apps/web ecco.tsx geometry) --------------------
function blobPoints(cx: number, cy: number, phase: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let k = 0; k < 12; k++) {
    const angle = (k / 12) * Math.PI * 2 - Math.PI / 2;
    const isTip = k % 2 === 0;
    const calm = k === 0 || k === 6 ? 0.45 : 1;
    const r = isTip
      ? 36 + calm * 3.4 * Math.sin(phase + k * 2.1)
      : 29.5 + calm * 1.8 * Math.cos(phase * 1.3 + k * 1.7);
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts;
}

function catmullRomClosed(pts: Array<[number, number]>): string {
  const n = pts.length;
  const p = (i: number) => pts[((i % n) + n) % n]!;
  let d = `M ${p(0)[0].toFixed(2)} ${p(0)[1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]!.toFixed(2)} ${c1[1]!.toFixed(2)} ${c2[0]!.toFixed(2)} ${c2[1]!.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d + " Z";
}

const FRAMES = [0, 2.1, 4.2].map((ph) => catmullRomClosed(blobPoints(60, 50, ph)));
const MORPH_VALUES = `${FRAMES[0]};${FRAMES[1]};${FRAMES[2]};${FRAMES[0]}`;

function morph(begin: string): string {
  return (
    `<animate attributeName="d" dur="7s" begin="${begin}" repeatCount="indefinite" calcMode="spline" ` +
    `keyTimes="0;0.33;0.66;1" keySplines="${EASE3}" values="${MORPH_VALUES}"/>`
  );
}

function blinkingEye(cx: number, begin: string): string {
  return (
    `<ellipse cx="${cx}" cy="48" rx="2.8" ry="2.8" fill="${INK}">` +
    `<animate attributeName="ry" values="2.8;2.8;0.4;2.8;2.8" keyTimes="0;0.44;0.5;0.56;1" dur="4.6s" begin="${begin}" repeatCount="indefinite"/>` +
    `</ellipse>` +
    `<circle cx="${cx + 1}" cy="47" r="0.9" fill="#fff" opacity="0.9"/>`
  );
}

function expression(pick: number, begin: string): string {
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
      blinkingEye(52, begin) +
      `<path d="M 64.5 49 Q 68 45.5 71.5 49" ${stroke}/>` +
      `<path d="M 52 58 Q 60 65 68 58" ${stroke}/>`
    );
  }
  return (
    blinkingEye(52, begin) + blinkingEye(68, begin) + `<path d="M 52 58 Q 60 65 68 58" ${stroke}/>`
  );
}

function accessory(pick: number, uid: string): string {
  switch (pick) {
    case 1: // graduation cap
      return (
        `<polygon points="60,2 88,13 60,24 32,13" fill="${INK}"/>` +
        `<polygon points="60,2 88,13 60,17 32,13" fill="#3A4569"/>` +
        `<path d="M 84 16 L 84 28" stroke="${INK}" stroke-width="2.5"/>` +
        `<circle cx="84" cy="30" r="3" fill="#FFB81F"/>`
      );
    case 2: // crown
      return `<path d="M 42 16 L 45 0 L 53 9 L 60 -4 L 67 9 L 75 0 L 78 16 Z" fill="url(#gold-${uid})" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
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
  const f = FLUX[petal]!;
  const backdrop = BACKDROPS[b(1) % BACKDROPS.length]!;
  const tilt = (b(4) % 11) - 5; // subtle head tilt, -5..+5 degrees
  const uid = h.subarray(0, 4).toString("hex");
  const begin = `-${(b(5) % 67) / 10}s`;
  const blink = `-${(b(6) % 41) / 10}s`;

  const defs =
    `<defs>` +
    `<linearGradient id="base-${uid}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${petal}" stop-opacity="0.92"/>` +
    `<stop offset="0.55" stop-color="${petal}"/>` +
    `<stop offset="1" stop-color="${f.b}"/>` +
    `</linearGradient>` +
    `<radialGradient id="haze1-${uid}" cx="0.3" cy="0.25" r="0.75">` +
    `<stop offset="0" stop-color="${f.c}" stop-opacity="0.85"/>` +
    `<stop offset="0.6" stop-color="${f.c}" stop-opacity="0.18"/>` +
    `<stop offset="1" stop-color="${f.c}" stop-opacity="0"/>` +
    `</radialGradient>` +
    `<radialGradient id="haze2-${uid}" cx="0.78" cy="0.8" r="0.8">` +
    `<stop offset="0" stop-color="${f.b}" stop-opacity="0.9"/>` +
    `<stop offset="0.55" stop-color="${f.b}" stop-opacity="0.25"/>` +
    `<stop offset="1" stop-color="${f.b}" stop-opacity="0"/>` +
    `</radialGradient>` +
    `<radialGradient id="sheen-${uid}" cx="0.32" cy="0.2" r="0.5">` +
    `<stop offset="0" stop-color="#fff" stop-opacity="0.5"/>` +
    `<stop offset="1" stop-color="#fff" stop-opacity="0"/>` +
    `</radialGradient>` +
    `<radialGradient id="face-${uid}" cx="0.42" cy="0.36" r="0.85">` +
    `<stop offset="0" stop-color="#FFFFFF"/>` +
    `<stop offset="0.72" stop-color="#F4F6FE"/>` +
    `<stop offset="1" stop-color="#D3DBF4"/>` +
    `</radialGradient>` +
    `<linearGradient id="tail-${uid}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#FFFFFF"/>` +
    `<stop offset="0.65" stop-color="#F2F4FD"/>` +
    `<stop offset="1" stop-color="#DFE5F7"/>` +
    `</linearGradient>` +
    `<linearGradient id="gold-${uid}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#FFE188"/><stop offset="1" stop-color="#F99F07"/>` +
    `</linearGradient>` +
    `<filter id="blur-${uid}" x="-40%" y="-40%" width="180%" height="180%">` +
    `<feGaussianBlur stdDeviation="2.4"/>` +
    `</filter>` +
    `</defs>`;

  const head =
    [`base-${uid}`, `haze1-${uid}`, `haze2-${uid}`, `sheen-${uid}`]
      .map((id) => `<path d="${FRAMES[0]}" fill="url(#${id})">${morph(begin)}</path>`)
      .join("") +
    `<path d="${FRAMES[0]}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round">${morph(begin)}</path>`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 152" width="${size}" height="${size}" role="img" aria-label="Receipt mascot for ${phrase}">`,
    `<rect width="144" height="152" rx="28" fill="${backdrop}"/>`,
    defs,
    `<g transform="translate(12 6) rotate(${tilt} 60 60)">`,
    // body: ribbon tails + curled hands
    `<path d="M 46 68 C 45.5 92 42 112 34 128 C 45 122 53 114 58 103 L 60 100 L 62 103 C 67 114 75 122 86 128 C 78 112 74.5 92 74 68 Z" fill="url(#tail-${uid})" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
    `<path d="M 37 72 C 33 83 36 93 46 98 C 48.5 99 50 97 49.5 95" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    `<path d="M 83 72 C 87 83 84 93 74 98 C 71.5 99 70 97 70.5 95" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    // liquid flux head + shaded face
    head,
    `<ellipse cx="60" cy="80" rx="17" ry="6" fill="${INK}" opacity="0.14" filter="url(#blur-${uid})"/>`,
    `<circle cx="60" cy="52" r="22" fill="url(#face-${uid})" stroke="${INK}" stroke-width="3"/>`,
    `<ellipse cx="52.5" cy="42" rx="7.5" ry="4.5" fill="#fff" opacity="0.6" transform="rotate(-18 52.5 42)"/>`,
    expression(b(2) % 3, blink),
    accessory(b(3) % 7, uid),
    `</g>`,
    `</svg>`,
  ].join("");
}
