"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EccoAvatar, EccoMark } from "./ecco";
import { useEccoProfile } from "./useEccoProfile";
import { BallotIcon, BookIcon, HomeIcon, WallIcon } from "./icons";

const TABS = [
  { href: "/", label: "Home", icon: HomeIcon, match: (p: string) => p === "/" },
  {
    href: "/elections",
    label: "Elections",
    icon: BallotIcon,
    match: (p: string) => p.startsWith("/elections") || p.startsWith("/vote"),
  },
  {
    href: "/wall",
    label: "The Wall",
    icon: WallIcon,
    match: (p: string) => p.includes("/board") || p === "/wall",
  },
  {
    href: "/how-it-works",
    label: "Learn",
    icon: BookIcon,
    match: (p: string) => p.startsWith("/how-it-works"),
  },
];

export function TopNav() {
  const pathname = usePathname() ?? "/";
  const { profile } = useEccoProfile();

  return (
    <div className="border-b border-royal-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 no-underline">
          <EccoMark size={30} />
          <span className="text-lg font-black tracking-tight text-ink">
            ecclesia<span className="text-royal-500">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {TABS.map((t) => {
            const active = t.match(pathname);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold no-underline transition ${
                  active
                    ? "bg-royal-50 text-royal-600"
                    : "text-ink/60 hover:bg-royal-50 hover:text-ink"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <t.icon size={18} />
                {t.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/me"
          className={`flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 no-underline transition ${
            pathname === "/me" ? "bg-royal-50" : "hover:bg-royal-50"
          }`}
        >
          <EccoAvatar size={32} look={profile.look} />
          <span className="hidden max-w-28 truncate text-sm font-extrabold text-ink sm:block">
            {profile.name}
          </span>
        </Link>
      </div>
    </div>
  );
}
