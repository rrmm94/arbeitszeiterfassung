"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { CategoryDistribution } from "@/components/dashboard/category-distribution";
import { useDisplayMode, formatIstSoll } from "@/components/display-mode-provider";
import { formatHours } from "@/lib/time";

interface MonthRow {
  key: string;
  label: string;
  year: number;
  nettoHours: number;
  sollHours: number;
  blocksWorked: number;
  blocksSoll: number;
  workdayCount: number;
}

interface YearOverviewData {
  startYear: number;
  months: MonthRow[];
  totals: {
    nettoHours: number;
    sollHours: number;
    diffHours: number;
    blocksWorked: number;
    blocksSoll: number;
    schoolHours: number;
    homeHours: number;
    homeHoursByCategory: { categoryId: number; name: string; color: string; hours: number }[];
  };
}

function schoolYearLabel(startYear: number) {
  return `Schuljahr ${startYear}/${(startYear + 1).toString().slice(-2)}`;
}

export default function YearOverviewPage() {
  const now = new Date();
  const defaultStartYear = now.getMonth() + 1 >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const [startYear, setStartYear] = useState(defaultStartYear);
  const [data, setData] = useState<YearOverviewData | null>(null);
  const { percentMode } = useDisplayMode();

  const load = useCallback(async () => {
    const res = await fetch(`/api/year-overview?startYear=${startYear}`);
    setData(await res.json());
  }, [startYear]);

  useEffect(() => {
    load();
    window.addEventListener("day-entry-updated", load);
    return () => window.removeEventListener("day-entry-updated", load);
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Jahresansicht"
        subtitle={schoolYearLabel(startYear)}
        actions={
          <div className="flex items-center rounded-md border border-border">
            <button onClick={() => setStartYear((y) => y - 1)} className="p-1.5 text-text-secondary hover:bg-bg-hover">
              <ChevronLeft size={15} />
            </button>
            <button onClick={() => setStartYear((y) => y + 1)} className="p-1.5 text-text-secondary hover:bg-bg-hover">
              <ChevronRight size={15} />
            </button>
          </div>
        }
      />

      {!data ? (
        <div className="flex h-64 items-center justify-center text-[13px] text-text-tertiary">Lädt…</div>
      ) : (
        <div className="flex flex-col gap-6 p-4 sm:p-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Arbeitszeit (Schuljahr)"
              value={
                percentMode
                  ? formatIstSoll(data.totals.nettoHours, data.totals.sollHours, true, formatHours)
                  : formatHours(data.totals.nettoHours)
              }
              sub={!percentMode ? `Soll: ${formatHours(data.totals.sollHours)}` : undefined}
            />
            <StatCard
              label="Über-/Minderstunden"
              value={`${data.totals.diffHours >= 0 ? "+" : ""}${formatHours(data.totals.diffHours)}`}
              accent={data.totals.diffHours >= 0 ? "positive" : "negative"}
            />
            <StatCard
              label="Unterrichtsblöcke (Schuljahr)"
              value={formatIstSoll(data.totals.blocksWorked, data.totals.blocksSoll, percentMode, (v) => String(Math.round(v)))}
            />
            <StatCard
              label="Auslastung (Schuljahr)"
              value={`${data.totals.sollHours > 0 ? Math.round((data.totals.nettoHours / data.totals.sollHours) * 100) : 0}%`}
            />
          </div>

          <div className="rounded-lg border border-border bg-bg-panel p-4">
            <h3 className="mb-3 text-[12.5px] font-medium text-text-primary">Verlauf über das Schuljahr</h3>
            <MonthlyChart months={data.months} />
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="border-b border-border bg-bg-panel p-2.5 text-left text-[11.5px] font-medium uppercase tracking-wide text-text-tertiary">
                    Monat
                  </th>
                  <th className="border-b border-l border-border bg-bg-panel p-2.5 text-right text-[11.5px] font-medium uppercase tracking-wide text-text-tertiary">
                    Arbeitszeit {percentMode ? "" : "(Ist / Soll)"}
                  </th>
                  <th className="border-b border-l border-border bg-bg-panel p-2.5 text-right text-[11.5px] font-medium uppercase tracking-wide text-text-tertiary">
                    Differenz
                  </th>
                  <th className="border-b border-l border-border bg-bg-panel p-2.5 text-right text-[11.5px] font-medium uppercase tracking-wide text-text-tertiary">
                    Blöcke {percentMode ? "" : "(Ist / Soll)"}
                  </th>
                  <th className="border-b border-l border-border bg-bg-panel p-2.5 text-right text-[11.5px] font-medium uppercase tracking-wide text-text-tertiary">
                    Werktage
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.months.map((m) => {
                  const diff = Math.round((m.nettoHours - m.sollHours) * 100) / 100;
                  return (
                    <tr key={m.key}>
                      <td className="border-b border-border p-2.5 text-text-primary">
                        {m.label} {m.year}
                      </td>
                      <td className="border-b border-l border-border p-2.5 text-right tabular text-text-primary">
                        {percentMode
                          ? formatIstSoll(m.nettoHours, m.sollHours, true, formatHours)
                          : `${formatHours(m.nettoHours)} / ${formatHours(m.sollHours)}`}
                      </td>
                      <td
                        className={`border-b border-l border-border p-2.5 text-right tabular ${
                          diff >= 0 ? "text-accent" : "text-danger"
                        }`}
                      >
                        {diff >= 0 ? "+" : ""}
                        {formatHours(diff)}
                      </td>
                      <td className="border-b border-l border-border p-2.5 text-right tabular text-text-primary">
                        {percentMode
                          ? formatIstSoll(m.blocksWorked, m.blocksSoll, true, (v) => String(Math.round(v)))
                          : `${m.blocksWorked} / ${m.blocksSoll}`}
                      </td>
                      <td className="border-b border-l border-border p-2.5 text-right tabular text-text-secondary">
                        {m.workdayCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="p-2.5 font-medium text-text-primary">Gesamt</td>
                  <td className="border-l border-border p-2.5 text-right tabular font-medium text-text-primary">
                    {percentMode
                      ? formatIstSoll(data.totals.nettoHours, data.totals.sollHours, true, formatHours)
                      : `${formatHours(data.totals.nettoHours)} / ${formatHours(data.totals.sollHours)}`}
                  </td>
                  <td
                    className={`border-l border-border p-2.5 text-right tabular font-medium ${
                      data.totals.diffHours >= 0 ? "text-accent" : "text-danger"
                    }`}
                  >
                    {data.totals.diffHours >= 0 ? "+" : ""}
                    {formatHours(data.totals.diffHours)}
                  </td>
                  <td className="border-l border-border p-2.5 text-right tabular font-medium text-text-primary">
                    {percentMode
                      ? formatIstSoll(data.totals.blocksWorked, data.totals.blocksSoll, true, (v) => String(Math.round(v)))
                      : `${data.totals.blocksWorked} / ${data.totals.blocksSoll}`}
                  </td>
                  <td className="border-l border-border p-2.5" />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="rounded-lg border border-border bg-bg-panel p-4">
            <h3 className="mb-1 text-[12.5px] font-medium text-text-primary">Zeitverteilung nach Kategorie</h3>
            <p className="mb-4 text-[11.5px] text-text-secondary">
              Wie sich die gesamte Arbeitszeit im Schuljahr auf Unterricht und die einzelnen Kategorien
              außerschulischer Arbeit aufteilt.
            </p>
            <CategoryDistribution
              items={[
                { name: "Unterricht (Schule)", color: "var(--accent)", hours: data.totals.schoolHours },
                ...data.totals.homeHoursByCategory.map((c) => ({ name: c.name, color: c.color, hours: c.hours })),
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
