"use client";

import { useState } from "react";
import { ShareIcon } from "./icons";

/** Copies a link to the clipboard — the honest version of a share button. */
export function ShareButton({ path, label = "Share" }: { path: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      const url = `${window.location.origin}${path}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable — nothing sensible to do in a demo.
    }
  }

  return (
    <button onClick={copy} className="feed-action">
      <ShareIcon size={15} />
      {copied ? "Link copied!" : label}
    </button>
  );
}
