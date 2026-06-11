import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { PROTOTYPE_DISCLAIMER } from "@ecclesia/shared";
import { PrototypeBanner } from "@/components/PrototypeBanner";

export const metadata: Metadata = {
  title: "Ecclesia Vote",
  description: "Transparent, verifiable advisory voting for organisations.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PrototypeBanner />
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold text-ink no-underline">
              ⚖&nbsp;Ecclesia&nbsp;Vote
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/how-it-works">How verification works</Link>
              <Link href="/org/demo-society">Demo org</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mt-12 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-slate-500">
            <p className="font-medium text-slate-600">{PROTOTYPE_DISCLAIMER}</p>
            <p className="mt-2">
              Open source · Apache-2.0 · Helios-grade integrity, Decidim-grade process.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
