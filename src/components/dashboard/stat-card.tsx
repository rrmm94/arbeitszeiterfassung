import { ReactNode } from "react";

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: "positive" | "negative" | "neutral";
}) {
  const accentClass =
    accent === "positive" ? "text-accent" : accent === "negative" ? "text-danger" : "text-text-primary";
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-bg-panel p-4">
      <span className="text-[11.5px] font-medium uppercase tracking-wide text-text-tertiary">{label}</span>
      <span className={`text-[22px] font-light tabular leading-none ${accentClass}`}>{value}</span>
      {sub && <span className="text-[12px] text-text-secondary">{sub}</span>}
    </div>
  );
}

export function ProgressBar({ value, max, color = "var(--accent)" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-hover">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function SplitBar({
  segments,
}: {
  segments: { value: number; color: string; label: string }[];
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-bg-hover">
        {segments.map((seg, i) => (
          <div
            key={i}
            style={{ width: `${(seg.value / total) * 100}%`, background: seg.color }}
            className="h-full first:rounded-l-full last:rounded-r-full"
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[12px] text-text-secondary">
            <span className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
            {seg.label} <span className="tabular text-text-primary">{seg.value.toFixed(1)}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}
