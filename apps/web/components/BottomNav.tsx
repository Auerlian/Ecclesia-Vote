"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BallotIcon, BookIcon, HomeIcon, UserIcon, WallIcon } from "./icons";

const ITEMS = [
  { href: "/", label: "Home", icon: HomeIcon, match: (p: string) => p === "/" },
  {
    href: "/elections",
    label: "Elections",
    icon: BallotIcon,
    match: (p: string) => p.startsWith("/elections") || p.startsWith("/vote"),
  },
  {
    href: "/wall",
    label: "Wall",
    icon: WallIcon,
    match: (p: string) => p.includes("/board") || p === "/wall",
  },
  {
    href: "/how-it-works",
    label: "Learn",
    icon: BookIcon,
    match: (p: string) => p.startsWith("/how-it-works"),
  },
  { href: "/me", label: "My Ecco", icon: UserIcon, match: (p: string) => p === "/me" },
];

/** Mobile bottom tab bar — the app-like navigation from the prototype. */
export function BottomNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-royal-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-extrabold no-underline transition ${
                active ? "text-royal-600" : "text-ink/50"
              }`}
            >
              <item.icon size={22} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
