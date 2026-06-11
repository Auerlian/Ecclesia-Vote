import type { TallyResult } from "@ecclesia/tally";

const LABELS: Record<string, string> = { yes: "Yes", no: "No" };

export function TallyBars({ tally }: { tally: TallyResult }) {
  const denom = Math.max(tally.accepted, 1);
  const rows = [
    ...tally.options.map((o) => ({ label: LABELS[o.optionId] ?? o.optionId, votes: o.votes })),
    { label: "Abstain", votes: tally.abstain },
  ];
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const p = Math.round((r.votes / denom) * 100);
        return (
          <div key={r.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium">{r.label}</span>
              <span className="tabular-nums text-slate-600">
                {r.votes} · {p}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-seal"
                style={{ width: `${p}%` }}
                aria-hidden
              />
            </div>
          </div>
        );
      })}
      {tally.spoiled > 0 && (
        <p className="text-xs text-slate-500">{tally.spoiled} spoiled ballot(s) excluded.</p>
      )}
    </div>
  );
}
