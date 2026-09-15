"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatCard, ProgressBar, SplitBar } from "@/components/dashboard/stat-card";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { formatHours } from "@/lib/time";

interface DashboardData {
  month: { key: string; totals: RangeTotals };
  schoolYear: { startYear: number; totals: RangeTotals; range: { start: string; end: string } };
  weeks: { key: string; weekNumber: number; nettoHours: number; sollHours: number }[];
  vacation: { used: number; budget: number; remaining: number };
}

interface RangeTotals {
  nettoHours: number;
  sollHours: number;
  diffHours: number;
  blocksWorked: number;
  blocksSoll: number;
  schoolHours: number;
  homeHours: number;
  homeHoursByCategory: { categoryId: number; name: string; color: string; hours: number }[];
  weekendHours: number;
  holidayHours: number;
  ferienHours: number;
  sickDays: number;
  vacationDaysUsed: number;
  workdayCount: number;
}

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    setData(await res.json());
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("day-entry-updated", load);
    return () => window.removeEventListener("day-entry-updated", load);
  }, [load]);

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-text-tertiary">Lädt…</div>
    );
  }

  const { month, schoolYear, weeks, vacation } = data;
  const [my, mm] = month.key.split("-").map(Number);
  const monthLabel = `${MONTH_NAMES[mm - 1]} ${my}`;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={monthLabel} />

      <div className="flex flex-col gap-6 p-4 sm:p-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Arbeitszeit (Monat)"
            value={formatHours(month.totals.nettoHours)}
            sub={`Soll: ${formatHours(month.totals.sollHours)}`}
          />
          <StatCard
            label="Über-/Minderstunden (Monat)"
            value={`${month.totals.diffHours >= 0 ? "+" : ""}${formatHours(month.totals.diffHours)}`}
            accent={month.totals.diffHours >= 0 ? "positive" : "negative"}
            sub={`Schuljahr: ${schoolYear.totals.diffHours >= 0 ? "+" : ""}${formatHours(schoolYear.totals.diffHours)}`}
          />
          <StatCard
            label="Unterrichtsblöcke (Monat)"
            value={`${month.totals.blocksWorked} / ${month.totals.blocksSoll}`}
            sub={`${month.totals.workdayCount} Werktage`}
          />
          <StatCard
            label="Urlaub"
            value={`${vacation.used} / ${vacation.budget}`}
            sub={`${vacation.remaining} Tage offen`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-bg-panel p-4 lg:col-span-2">
            <h3 className="mb-3 text-[12.5px] font-medium text-text-primary">Verlauf letzte Kalenderwochen</h3>
            <WeeklyChart weeks={weeks} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-border bg-bg-panel p-4">
              <h3 className="mb-3 text-[12.5px] font-medium text-text-primary">Auslastung (Monat)</h3>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-[20px] font-light tabular text-text-primary">
                  {month.totals.sollHours > 0
                    ? Math.round((month.totals.nettoHours / month.totals.sollHours) * 100)
                    : 0}
                  %
                </span>
              </div>
              <ProgressBar value={month.totals.nettoHours} max={Math.max(month.totals.sollHours, month.totals.nettoHours)} />
            </div>

            <div className="rounded-lg border border-border bg-bg-panel p-4">
              <h3 className="mb-3 text-[12.5px] font-medium text-text-primary">Schule vs. außerschulisch</h3>
              <SplitBar
                segments={[
                  { value: month.totals.schoolHours, color: "var(--accent)", label: "Schule" },
                  { value: month.totals.homeHours, color: "var(--text-tertiary)", label: "Außerschulisch" },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-bg-panel p-4 lg:col-span-2">
            <h3 className="mb-3 text-[12.5px] font-medium text-text-primary">Außerschulische Kategorien (Monat)</h3>
            {month.totals.homeHoursByCategory.length === 0 ? (
              <p className="text-[12.5px] text-text-tertiary">Noch keine Einträge in diesem Monat.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {month.totals.homeHoursByCategory.map((c) => (
                  <div key={c.categoryId} className="flex items-center gap-3">
                    <span className="w-32 truncate text-[12.5px] text-text-secondary">{c.name}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-hover">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (c.hours / Math.max(...month.totals.homeHoursByCategory.map((x) => x.hours))) * 100)}%`,
                          background: c.color,
                        }}
                      />
                    </div>
                    <span className="w-12 text-right text-[12px] tabular text-text-primary">{c.hours}h</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-bg-panel p-4">
            <h3 className="mb-3 text-[12.5px] font-medium text-text-primary">Außerhalb der Regel (Monat)</h3>
            <div className="flex flex-col gap-2 text-[12.5px]">
              <div className="flex justify-between">
                <span className="text-text-secondary">Wochenende</span>
                <span className="tabular text-text-primary">{formatHours(month.totals.weekendHours)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Feiertage</span>
                <span className="tabular text-text-primary">{formatHours(month.totals.holidayHours)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Ferien</span>
                <span className="tabular text-text-primary">{formatHours(month.totals.ferienHours)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Krankheitstage</span>
                <span className="tabular text-text-primary">{month.totals.sickDays}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
