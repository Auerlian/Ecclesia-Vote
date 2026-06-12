import "@fontsource-variable/nunito";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { PROTOTYPE_DISCLAIMER } from "@ecclesia/shared";
import { activeEngine, isPrototype } from "@/lib/engine";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: {
    default: "Ecclesia, the social democracy platform",
    template: "%s · Ecclesia",
  },
  description:
    "Decide together. Transparent, verifiable voting for societies, clubs and organisations.",
};

export const viewport: Viewport = {
  themeColor: "#3D6BFF",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-50">
          <TopNav />
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:pb-12">{children}</main>
        <BottomNav />
        <footer className="mt-4 border-t border-royal-100 bg-white pb-20 md:pb-0">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-ink/50">
            {/* INV (WP-09): the §1 disclaimer appears on every page, keyed off the engine. */}
            {isPrototype && (
              <p className="font-bold text-ink/60">
                {PROTOTYPE_DISCLAIMER} Active engine:{" "}
                <code className="font-mono">{activeEngine.engineId}</code> (prototype security
                class, no real encryption yet).
              </p>
            )}
            <p>
              Open source · Apache-2.0 · Helios-grade integrity, Decidim-grade process.{" "}
              <Link href="/how-it-works" className="font-bold text-royal-600">
                How verification works
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
