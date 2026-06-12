import type { ReactNode } from "react";

export interface TallyRow {
  key: string;
  label: string;
  votes: number;
  /** Tailwind gradient classes for the bar fill. */
  barClass?: string;
  avatar?: ReactNode;
  sublabel?: string;
}

/** Horizontal results bars with optional avatars — denominator is the largest row, so the
 *  leader always fills the track and the rest read as proportions of it. */
export function TallyBars({ rows, totalBallots }: { rows: TallyRow[]; totalBallots: number }) {
  const max = Math.max(...rows.map((r) => r.votes), 1);
  return (
    <div className="space-y-4">
      {rows.map((r, i) => {
        const widthPct = Math.round((r.votes / max) * 100);
        const sharePct = totalBallots > 0 ? Math.round((r.votes / totalBallots) * 100) : 0;
        return (
          <div key={r.key} className="flex items-center gap-3">
            {r.avatar && <div className="shrink-0">{r.avatar}</div>}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-extrabold text-ink">
                  {r.label}
                  {r.sublabel && (
                    <span className="ml-2 text-xs font-bold text-ink/40">{r.sublabel}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs font-extrabold tabular-nums text-ink/55">
                  {r.votes} · {sharePct}%
                </span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-royal-50">
                <div
                  className={`h-full origin-left animate-grow-bar rounded-full ${r.barClass ?? "bg-gradient-to-r from-royal-400 to-royal-600"}`}
                  style={{ width: `${widthPct}%`, animationDelay: `${i * 120}ms` }}
                  aria-hidden
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
