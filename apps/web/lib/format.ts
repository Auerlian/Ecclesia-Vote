export function shortHash(h: string, head = 14): string {
  if (!h) return "";
  return h.length <= head + 8 ? h : `${h.slice(0, head)}…${h.slice(-6)}`;
}

export function pct(n: number, d: number): string {
  return d === 0 ? "0%" : `${Math.round((n / d) * 100)}%`;
}
