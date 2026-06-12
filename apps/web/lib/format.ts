export function shortHash(h: string, head = 14): string {
  if (!h) return "";
  return h.length <= head + 8 ? h : `${h.slice(0, head)}…${h.slice(-6)}`;
}

export function pct(n: number, d: number): string {
  return d === 0 ? "0%" : `${Math.round((n / d) * 100)}%`;
}

/** Coarse relative time for feed metadata ("3h ago"). Server-rendered, so minute-level precision
 *  would go stale anyway — we deliberately stay coarse. */
export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "soon";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
