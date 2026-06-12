import type { CSSProperties } from "react";

/**
 * Ecco — the Ecclesia mascot. A rosette ribbon character (see the brand logo): scalloped
 * rosette head, round face, ribbon tails, little curled hands. Everything is inline SVG —
 * no external assets, CSP-friendly on ballot pages, and trivially recolourable.
 *
 * `eccoVariant(seed)` derives a stable outfit from any string, so candidates, demo voters
 * and receipt mascots each get a recognisable, deterministic look. Pure JS hash — safe in
 * both server and client components.
 */

export const ECCO_PETAL_COLORS = [
  "#3D6BFF", // royal
  "#FF5C39", // coral
  "#FFB81F", // sunshine
  "#12B97E", // mint
  "#8B4DFF", // grape
  "#F83D8E", // blush
  "#38BDF8", // sky
  "#FB923C", // tangerine
] as const;

export const ECCO_ACCESSORIES = [
  "none",
  "cap",
  "tophat",
  "crown",
  "bow",
  "moustache",
  "glasses",
  "balloon",
  "flower",
] as const;
export type EccoAccessory = (typeof ECCO_ACCESSORIES)[number];

export const ECCO_EXPRESSIONS = ["happy", "joy", "wink"] as const;
export type EccoExpression = (typeof ECCO_EXPRESSIONS)[number];

export interface EccoLook {
  petal: string;
  accessory: EccoAccessory;
  expression: EccoExpression;
}

const INK = "#232B49";

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
  let path = `M ${last[0].toFixed(2)} ${last[1].toFixed(2)}`;
  for (const [x, y] of pts) {
    path += ` A ${r} ${r} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return path + " Z";
}

const HEAD_PATH = rosettePath(60, 50, 8, 24, 12.5);

/** Tiny deterministic string hash (xmur3) — NOT cryptographic, purely decorative. */
function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** Stable decorative outfit for any seed string. */
export function eccoVariant(seed: string): EccoLook {
  const h = hashSeed(seed);
  return {
    petal: ECCO_PETAL_COLORS[h % ECCO_PETAL_COLORS.length]!,
    accessory: ECCO_ACCESSORIES[(h >>> 3) % ECCO_ACCESSORIES.length]!,
    expression: ECCO_EXPRESSIONS[(h >>> 7) % ECCO_EXPRESSIONS.length]!,
  };
}

function Expression({ kind }: { kind: EccoExpression }) {
  const stroke = { stroke: INK, strokeWidth: 3, fill: "none", strokeLinecap: "round" } as const;
  if (kind === "joy") {
    return (
      <>
        <path d="M 48.5 48.5 Q 52 44 55.5 48.5" {...stroke} />
        <path d="M 64.5 48.5 Q 68 44 71.5 48.5" {...stroke} />
        <path d="M 52 57 Q 60 67 68 57 Z" fill={INK} />
      </>
    );
  }
  if (kind === "wink") {
    return (
      <>
        <circle cx="52" cy="48" r="2.8" fill={INK} />
        <path d="M 64.5 49 Q 68 45.5 71.5 49" {...stroke} />
        <path d="M 52 58 Q 60 65 68 58" {...stroke} />
      </>
    );
  }
  return (
    <>
      <circle cx="52" cy="48" r="2.8" fill={INK} />
      <circle cx="68" cy="48" r="2.8" fill={INK} />
      <path d="M 52 58 Q 60 65 68 58" {...stroke} />
    </>
  );
}

function Accessory({ kind }: { kind: EccoAccessory }) {
  switch (kind) {
    case "cap":
      return (
        <g>
          <polygon points="60,2 88,13 60,24 32,13" fill={INK} />
          <path d="M 84 16 L 84 28" stroke={INK} strokeWidth="2.5" />
          <circle cx="84" cy="30" r="3" fill="#FFB81F" />
        </g>
      );
    case "tophat":
      return (
        <g>
          <rect x="44" y="-6" width="32" height="24" rx="3" fill={INK} />
          <rect x="36" y="14" width="48" height="7" rx="3.5" fill={INK} />
          <rect x="44" y="8" width="32" height="6" fill="#FF5C39" />
        </g>
      );
    case "crown":
      return (
        <path
          d="M 42 16 L 45 0 L 53 9 L 60 -4 L 67 9 L 75 0 L 78 16 Z"
          fill="#FFB81F"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      );
    case "bow":
      return (
        <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M 60 76 L 47 70 L 47 83 Z" fill="#FF5C39" />
          <path d="M 60 76 L 73 70 L 73 83 Z" fill="#FF5C39" />
          <circle cx="60" cy="76.5" r="4" fill="#FF5C39" />
        </g>
      );
    case "moustache":
      return (
        <path
          d="M 60 56.5 C 55 52.5 48 54 46.5 59.5 C 51.5 62 57.5 60 60 56.5 C 62.5 60 68.5 62 73.5 59.5 C 72 54 65 52.5 60 56.5 Z"
          fill={INK}
        />
      );
    case "glasses":
      return (
        <g fill="none" stroke={INK} strokeWidth="2.5">
          <circle cx="52" cy="48" r="7" />
          <circle cx="68" cy="48" r="7" />
          <path d="M 59 48 L 61 48" />
          <path d="M 45 47 L 40 45" />
          <path d="M 75 47 L 80 45" />
        </g>
      );
    case "balloon":
      return (
        <g>
          <path d="M 94 38 C 90 56 84 68 76 76" stroke={INK} strokeWidth="2" fill="none" />
          <ellipse cx="95" cy="24" rx="11" ry="13" fill="#F83D8E" stroke={INK} strokeWidth="2.5" />
          <polygon points="95,36 92,41 98,41" fill="#F83D8E" stroke={INK} strokeWidth="2" />
        </g>
      );
    case "flower":
      return (
        <g>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle
              key={a}
              cx={86 + 6 * Math.cos((a * Math.PI) / 180)}
              cy={22 + 6 * Math.sin((a * Math.PI) / 180)}
              r="4"
              fill="#FF92C4"
              stroke={INK}
              strokeWidth="2"
            />
          ))}
          <circle cx="86" cy="22" r="3.5" fill="#FFB81F" stroke={INK} strokeWidth="2" />
        </g>
      );
    default:
      return null;
  }
}

export function Ecco({
  size = 96,
  petal = "#3D6BFF",
  expression = "happy",
  accessory = "none",
  className,
  style,
}: {
  size?: number;
  petal?: string;
  expression?: EccoExpression;
  accessory?: EccoAccessory;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="-12 -14 144 150"
      width={size}
      height={(size * 150) / 144}
      className={className}
      style={style}
      role="img"
      aria-label="Ecco the Ecclesia mascot"
    >
      {/* body: ribbon tails + curled hands */}
      <path
        d="M 46 68 C 45.5 92 42 112 34 128 C 45 122 53 114 58 103 L 60 100 L 62 103 C 67 114 75 122 86 128 C 78 112 74.5 92 74 68 Z"
        fill="#fff"
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M 37 72 C 33 83 36 93 46 98 C 48.5 99 50 97 49.5 95"
        stroke={INK}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 83 72 C 87 83 84 93 74 98 C 71.5 99 70 97 70.5 95"
        stroke={INK}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* rosette head + face */}
      <path d={HEAD_PATH} fill={petal} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="60" cy="52" r="22" fill="#fff" stroke={INK} strokeWidth="3" />
      <Expression kind={expression} />
      <Accessory kind={accessory} />
    </svg>
  );
}

/**
 * Head-only Ecco in a soft tinted circle — the "profile picture" used across the feed.
 * Crops the same drawing to the head, so avatars and full mascots always match.
 */
export function EccoAvatar({
  seed,
  size = 40,
  look,
  className,
}: {
  seed?: string;
  size?: number;
  look?: Partial<EccoLook>;
  className?: string;
}) {
  const base: EccoLook = seed
    ? eccoVariant(seed)
    : { petal: "#3D6BFF", accessory: "none", expression: "happy" };
  const v: EccoLook = {
    petal: look?.petal ?? base.petal,
    accessory: look?.accessory ?? base.accessory,
    expression: look?.expression ?? base.expression,
  };
  // The balloon floats outside the circular crop — swap it for a bare head on avatars.
  const accessory = v.accessory === "balloon" ? "none" : v.accessory;
  return (
    <svg
      viewBox="14 -8 92 102"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Ecco avatar"
      style={{ borderRadius: "9999px", background: `${v.petal}22` }}
    >
      <path d={HEAD_PATH} fill={v.petal} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="60" cy="52" r="22" fill="#fff" stroke={INK} strokeWidth="3" />
      <Expression kind={v.expression} />
      <Accessory kind={accessory} />
    </svg>
  );
}

/** Tiny brand mark (rosette head only, no accessories) for the nav and favicons. */
export function EccoMark({ size = 28, petal = "#3D6BFF" }: { size?: number; petal?: string }) {
  return (
    <svg viewBox="16 6 88 88" width={size} height={size} role="img" aria-label="Ecclesia">
      <path d={HEAD_PATH} fill={petal} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="60" cy="52" r="22" fill="#fff" stroke={INK} strokeWidth="4" />
      <circle cx="52" cy="48" r="2.8" fill={INK} />
      <circle cx="68" cy="48" r="2.8" fill={INK} />
      <path
        d="M 52 58 Q 60 65 68 58"
        stroke={INK}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
