import type { SVGProps } from "react";

/**
 * Minimal hand-drawn icon set (24×24, stroke-based) so the app needs no icon dependency.
 * All icons inherit `currentColor`.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function HomeIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3.5 10.5 12 3l8.5 7.5" />
      <path d="M5.5 9.5V20h5v-5h3v5h5V9.5" />
    </svg>
  );
}

export function BallotIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 12h16v8H4z" />
      <path d="M9 12V5.5L15 4v8" />
      <path d="M10 16h4" />
    </svg>
  );
}

export function WallIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="2" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="2" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="2" />
    </svg>
  );
}

export function BookIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 6.5C10.5 5 8.5 4.5 4 4.5v14c4.5 0 6.5.5 8 2 1.5-1.5 3.5-2 8-2v-14c-4.5 0-6.5.5-8 2Z" />
      <path d="M12 6.5v14" />
    </svg>
  );
}

export function UserIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c1.5-3.5 4-5 7.5-5s6 1.5 7.5 5" />
    </svg>
  );
}

export function ShieldIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3 5 5.5v6c0 4.5 3 7.5 7 9.5 4-2 7-5 7-9.5v-6L12 3Z" />
      <path d="m9 11.5 2.2 2.2L15.5 9" />
    </svg>
  );
}

export function ClockIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function SparkleIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 4.5 13.8 10 19.5 12l-5.7 2-1.8 5.5L10.2 14 4.5 12l5.7-2L12 4.5Z" />
    </svg>
  );
}

export function ChartIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8.5 16v-6" />
      <path d="M13 16V7" />
      <path d="M17.5 16v-3.5" />
    </svg>
  );
}

export function SearchIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
  );
}

export function ShareIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="6" cy="12" r="2.8" />
      <circle cx="17.5" cy="5.5" r="2.8" />
      <circle cx="17.5" cy="18.5" r="2.8" />
      <path d="m8.5 10.6 6.5-3.8M8.5 13.4l6.5 3.8" />
    </svg>
  );
}

export function MegaphoneIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 10v4l3 .5V9.5L4 10Z" />
      <path d="M7 9.5 19 5v14l-12-4.5" />
      <path d="M9.5 15.5c0 2 .8 3.5 2.5 3.5" />
    </svg>
  );
}

export function LockIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="5.5" y="10.5" width="13" height="9" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </svg>
  );
}

export function CheckCircleIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5" />
    </svg>
  );
}

export function PartyIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m6 14-2.5 7.5L11 19" />
      <path d="M6 14c2 1.5 4 3 5 5" />
      <path d="M12 4.5l.5 2M17 5l-1.5 2.5M20 10.5 17.5 11" />
      <path d="M13.5 9.5c2 .5 4.5 3 5 5.5" />
    </svg>
  );
}

export function ArrowRightIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4.5 12h15" />
      <path d="m13.5 6 6 6-6 6" />
    </svg>
  );
}
