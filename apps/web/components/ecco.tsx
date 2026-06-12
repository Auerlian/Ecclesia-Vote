import type { CSSProperties, ReactNode } from "react";

/**
 * Ecco, the Ecclesia mascot. A liquid six-lobed "flux" droplet with a round face and ribbon
 * tails. The flux form is deliberate: it stands for the haze of an undecided mind, so the head
 * is a diffused, multicoloured blob that slowly morphs like a floating droplet.
 *
 * Everything is inline SVG with native SMIL animation: no WebGL contexts (pages render dozens
 * of Eccos at once), no external assets, CSP-friendly on ballot pages, deterministic output.
 * `eccoVariant(seed)` derives a stable look from any string so candidates and demo voters get
 * recognisable, repeatable characters.
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
const EASE = "0.4 0 0.6 1;0.4 0 0.6 1";

// ---- the liquid blob ---------------------------------------------------
// 12 alternating control points (lobe tip / valley) smoothed with a closed Catmull-Rom
// spline. All frames share the point count, so SMIL can morph between them fluidly.
// Top and bottom points stay calm so hats and chin accessories track the head.
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

const BLOB_FRAMES = [0, 2.1, 4.2].map((ph) => catmullRomClosed(blobPoints(60, 50, ph)));
const BLOB_MORPH_VALUES = `${BLOB_FRAMES[0]};${BLOB_FRAMES[1]};${BLOB_FRAMES[2]};${BLOB_FRAMES[0]}`;

/** Tiny deterministic string hash (xmur3). NOT cryptographic, purely decorative. */
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

/**
 * Gradient/filter ids must be unique per LOOK (not per instance): two Eccos with the same
 * look share identical defs, so id collisions between them are harmless by construction.
 * Desync offsets derive from the same hash so a wall of Eccos never moves in lockstep.
 */
function lookUid(look: EccoLook, salt: string): { uid: string; h: number } {
  const h = hashSeed(`${look.petal}|${look.accessory}|${look.expression}|${salt}`);
  return { uid: h.toString(36), h };
}

function Morph({ begin }: { begin: string }) {
  return (
    <animate
      attributeName="d"
      dur="7s"
      begin={begin}
      repeatCount="indefinite"
      calcMode="spline"
      keyTimes="0;0.33;0.66;1"
      keySplines={`${EASE};0.4 0 0.6 1`}
      values={BLOB_MORPH_VALUES}
    />
  );
}

function FluxDefs({ uid, petal }: { uid: string; petal: string }) {
  const f = FLUX[petal] ?? FLUX["#3D6BFF"]!;
  return (
    <defs>
      <linearGradient id={`base-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={petal} stopOpacity="0.92" />
        <stop offset="0.55" stopColor={petal} />
        <stop offset="1" stopColor={f.b} />
      </linearGradient>
      <radialGradient id={`haze1-${uid}`} cx="0.3" cy="0.25" r="0.75">
        <stop offset="0" stopColor={f.c} stopOpacity="0.85" />
        <stop offset="0.6" stopColor={f.c} stopOpacity="0.18" />
        <stop offset="1" stopColor={f.c} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`haze2-${uid}`} cx="0.78" cy="0.8" r="0.8">
        <stop offset="0" stopColor={f.b} stopOpacity="0.9" />
        <stop offset="0.55" stopColor={f.b} stopOpacity="0.25" />
        <stop offset="1" stopColor={f.b} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`sheen-${uid}`} cx="0.32" cy="0.2" r="0.5">
        <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`face-${uid}`} cx="0.42" cy="0.36" r="0.85">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="0.72" stopColor="#F4F6FE" />
        <stop offset="1" stopColor="#D3DBF4" />
      </radialGradient>
      <linearGradient id={`tail-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="0.65" stopColor="#F2F4FD" />
        <stop offset="1" stopColor="#DFE5F7" />
      </linearGradient>
      <linearGradient id={`gold-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFE188" />
        <stop offset="1" stopColor="#F99F07" />
      </linearGradient>
      <filter id={`blur-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="2.4" />
      </filter>
    </defs>
  );
}

/** The morphing flux head: stacked copies of the same animated path build the diffusion. */
function FluxHead({ uid, begin }: { uid: string; begin: string }) {
  const layers = [`base-${uid}`, `haze1-${uid}`, `haze2-${uid}`, `sheen-${uid}`];
  return (
    <>
      {layers.map((id) => (
        <path key={id} d={BLOB_FRAMES[0]} fill={`url(#${id})`}>
          <Morph begin={begin} />
        </path>
      ))}
      <path d={BLOB_FRAMES[0]} fill="none" stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <Morph begin={begin} />
      </path>
    </>
  );
}

function BlinkingEye({ cx, begin }: { cx: number; begin: string }) {
  return (
    <>
      <ellipse cx={cx} cy="48" rx="2.8" ry="2.8" fill={INK}>
        <animate
          attributeName="ry"
          values="2.8;2.8;0.4;2.8;2.8"
          keyTimes="0;0.44;0.5;0.56;1"
          dur="4.6s"
          begin={begin}
          repeatCount="indefinite"
        />
      </ellipse>
      <circle cx={cx + 1} cy="47" r="0.9" fill="#fff" opacity="0.9" />
    </>
  );
}

function Expression({ kind, begin }: { kind: EccoExpression; begin: string }) {
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
        <BlinkingEye cx={52} begin={begin} />
        <path d="M 64.5 49 Q 68 45.5 71.5 49" {...stroke} />
        <path d="M 52 58 Q 60 65 68 58" {...stroke} />
      </>
    );
  }
  return (
    <>
      <BlinkingEye cx={52} begin={begin} />
      <BlinkingEye cx={68} begin={begin} />
      <path d="M 52 58 Q 60 65 68 58" {...stroke} />
    </>
  );
}

function Accessory({ kind, uid }: { kind: EccoAccessory; uid: string }) {
  switch (kind) {
    case "cap":
      return (
        <g>
          <polygon points="60,2 88,13 60,24 32,13" fill={INK} />
          <polygon points="60,2 88,13 60,17 32,13" fill="#3A4569" />
          <path d="M 84 16 L 84 28" stroke={INK} strokeWidth="2.5" />
          <circle cx="84" cy="30" r="3" fill="#FFB81F" />
        </g>
      );
    case "tophat":
      return (
        <g>
          <rect x="44" y="-6" width="32" height="24" rx="3" fill={INK} />
          <rect x="46" y="-4" width="10" height="20" rx="3" fill="#3A4569" />
          <rect x="36" y="14" width="48" height="7" rx="3.5" fill={INK} />
          <rect x="44" y="8" width="32" height="6" fill="#FF5C39" />
        </g>
      );
    case "crown":
      return (
        <path
          d="M 42 16 L 45 0 L 53 9 L 60 -4 L 67 9 L 75 0 L 78 16 Z"
          fill={`url(#gold-${uid})`}
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
          <ellipse
            cx="91.5"
            cy="19"
            rx="3.5"
            ry="5"
            fill="#fff"
            opacity="0.5"
            transform="rotate(-20 91.5 19)"
          />
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

/** Shared face stack: shadow cast by the head, shaded sphere, gloss, expression. */
function Face({
  uid,
  expression,
  begin,
}: {
  uid: string;
  expression: EccoExpression;
  begin: string;
}) {
  return (
    <>
      <ellipse
        cx="60"
        cy="80"
        rx="17"
        ry="6"
        fill={INK}
        opacity="0.14"
        filter={`url(#blur-${uid})`}
      />
      <circle cx="60" cy="52" r="22" fill={`url(#face-${uid})`} stroke={INK} strokeWidth="3" />
      <ellipse
        cx="52.5"
        cy="42"
        rx="7.5"
        ry="4.5"
        fill="#fff"
        opacity="0.6"
        transform="rotate(-18 52.5 42)"
      />
      <Expression kind={expression} begin={begin} />
    </>
  );
}

export function Ecco({
  size = 96,
  petal = "#3D6BFF",
  expression = "happy",
  accessory = "none",
  animated = true,
  className,
  style,
}: {
  size?: number;
  petal?: string;
  expression?: EccoExpression;
  accessory?: EccoAccessory;
  /** Idle bob and breathing ground shadow. The liquid morph and blink always run. */
  animated?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const { uid, h } = lookUid({ petal, accessory, expression }, "full");
  const begin = `${-((h % 67) / 10)}s`;
  const blink = `${-((h % 41) / 10)}s`;

  const body: ReactNode = (
    <>
      <path
        d="M 46 68 C 45.5 92 42 112 34 128 C 45 122 53 114 58 103 L 60 100 L 62 103 C 67 114 75 122 86 128 C 78 112 74.5 92 74 68 Z"
        fill={`url(#tail-${uid})`}
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
    </>
  );

  return (
    <svg
      viewBox="-12 -14 144 158"
      width={size}
      height={(size * 158) / 144}
      className={className}
      style={style}
      role="img"
      aria-label="Ecco the Ecclesia mascot"
    >
      <FluxDefs uid={uid} petal={petal} />
      {animated && (
        <ellipse
          cx="60"
          cy="136"
          rx="27"
          ry="4.6"
          fill={INK}
          opacity="0.16"
          filter={`url(#blur-${uid})`}
        >
          <animate
            attributeName="rx"
            values="27;24;27"
            dur="4s"
            begin={begin}
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.5;1"
            keySplines={EASE}
          />
        </ellipse>
      )}
      <g>
        {animated && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0;0 -3.5;0 0"
            dur="4s"
            begin={begin}
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.5;1"
            keySplines={EASE}
          />
        )}
        {body}
        <FluxHead uid={uid} begin={begin} />
        <Face uid={uid} expression={expression} begin={blink} />
        <Accessory kind={accessory} uid={uid} />
      </g>
    </svg>
  );
}

/**
 * Head-only Ecco in a soft tinted circle, the profile picture used across the feed. Keeps the
 * liquid morph and blink so even avatars feel alive; skips the bob so rows stay tidy.
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
  // The balloon floats outside the circular crop, so avatars wear a bare head instead.
  const accessory = v.accessory === "balloon" ? "none" : v.accessory;
  const { uid, h } = lookUid({ ...v, accessory }, "avatar");
  const begin = `${-((h % 67) / 10)}s`;
  const blink = `${-((h % 41) / 10)}s`;

  return (
    <svg
      viewBox="14 -8 92 102"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Ecco avatar"
      style={{ borderRadius: "9999px", background: `${v.petal}1f` }}
    >
      <FluxDefs uid={uid} petal={v.petal} />
      <FluxHead uid={uid} begin={begin} />
      <Face uid={uid} expression={v.expression} begin={blink} />
      <Accessory kind={accessory} uid={uid} />
    </svg>
  );
}

/** Static brand mark (flux head only) for the nav. Logos should hold still. */
export function EccoMark({ size = 28, petal = "#3D6BFF" }: { size?: number; petal?: string }) {
  const { uid } = lookUid({ petal, accessory: "none", expression: "happy" }, "mark");
  return (
    <svg viewBox="18 8 84 84" width={size} height={size} role="img" aria-label="Ecclesia">
      <FluxDefs uid={uid} petal={petal} />
      <path d={BLOB_FRAMES[0]} fill={`url(#base-${uid})`} />
      <path d={BLOB_FRAMES[0]} fill={`url(#haze1-${uid})`} />
      <path d={BLOB_FRAMES[0]} fill={`url(#sheen-${uid})`} />
      <path d={BLOB_FRAMES[0]} fill="none" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="60" cy="52" r="22" fill={`url(#face-${uid})`} stroke={INK} strokeWidth="4" />
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
