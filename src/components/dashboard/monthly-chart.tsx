"use client";

import { Bar, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface MonthPoint {
  key: string;
  label: string;
  nettoHours: number;
  sollHours: number;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-border bg-bg-panel px-2.5 py-1.5 text-[12px] shadow-md">
      <div className="mb-1 font-medium text-text-primary">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-text-secondary">
          <span>{p.name}</span>
          <span className="tabular text-text-primary">{p.value.toFixed(1)}h</span>
        </div>
      ))}
    </div>
  );
}

export function MonthlyChart({ months }: { months: MonthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={months} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap={14}>
        <XAxis
          dataKey="label"
          tickFormatter={(v: string) => v.slice(0, 3)}
          tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} width={32} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--bg-hover)" }} />
        <Bar dataKey="nettoHours" name="Ist" fill="var(--accent)" radius={[3, 3, 0, 0]} maxBarSize={28} />
        <Line dataKey="sollHours" name="Soll" stroke="var(--text-tertiary)" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
