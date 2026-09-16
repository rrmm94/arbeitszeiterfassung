"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui";
import { StatCard, ProgressBar, SplitBar } from "@/components/dashboard/stat-card";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { useDisplayMode, formatIstSoll } from "@/components/display-mode-provider";
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

function shiftMonth(year: number, month: number, delta: number): [number, number] {
  const total = year * 12 + (month - 1) + delta;
  return [Math.floor(total / 12), (total % 12) + 1];
}

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<DashboardData | null>(null);
  const { percentMode } = useDisplayMode();

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  const load = useCallback(async () => {
    const res = await fetch(`/api/dashboard?month=${monthKey}`);
    setData(await res.json());
  }, [monthKey]);

  useEffect(() => {
    load();
    window.addEventListener("day-entry-updated", load);
    return () => window.removeEventListener("day-entry-updated", load);
  }, [load]);

  function goToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  }
  function shift(delta: number) {
    const [y, m] = shiftMonth(year, month, delta);
    setYear(y);
    setMonth(m);
  }

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  const maxCategoryHours = data && data.month.totals.homeHoursByCategory.length > 0
    ? Math.max(...data.month.totals.homeHoursByCategory.map((x) => x.hours))
    : 0;
  const totalHomeHours = data ? data.month.totals.homeHoursByCategory.reduce((s, c) => s + c.hours, 0) : 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={monthLabel}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={goToday}>Heute</Button>
            <div className="flex items-center rounded-md border border-border">
              <button onClick={() => shift(-1)} className="p-1.5 text-text-secondary hover:bg-bg-hover">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => shift(1)} className="p-1.5 text-text-secondary hover:bg-bg-hover">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        }
      />

      {!data ? (
        <div className="flex h-64 items-center justify-center text-[13px] text-text-tertiary">Lädt…</div>
      ) : (
        <DashboardContent data={data} percentMode={percentMode} maxCategoryHours={maxCategoryHours} totalHomeHours={totalHomeHours} />
      )}
    </div>
  );
}

function DashboardContent({
  data,
  percentMode,
  maxCategoryHours,
  totalHomeHours,
}: {
  data: DashboardData;
  percentMode: boolean;
  maxCategoryHours: number;
  totalHomeHours: number;
}) {
  const { month, schoolYear, weeks, vacation } = data;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Arbeitszeit (Monat)"
          value={
            percentMode
              ? formatIstSoll(month.totals.nettoHours, month.totals.sollHours, true, formatHours)
              : formatHours(month.totals.nettoHours)
          }
          sub={!percentMode ? `Soll: ${formatHours(month.totals.sollHours)}` : undefined}
        />
        <StatCard
          label="Über-/Minderstunden (Monat)"
          value={`${month.totals.diffHours >= 0 ? "+" : ""}${formatHours(month.totals.diffHours)}`}
          accent={month.totals.diffHours >= 0 ? "positive" : "negative"}
          sub={`Schuljahr: ${schoolYear.totals.diffHours >= 0 ? "+" : ""}${formatHours(schoolYear.totals.diffHours)}`}
        />
        <StatCard
          label="Unterrichtsblöcke (Monat)"
          value={formatIstSoll(month.totals.blocksWorked, month.totals.blocksSoll, percentMode, (v) => String(Math.round(v)))}
          sub={!percentMode ? `${month.totals.workdayCount} Werktage` : undefined}
        />
        <StatCard
          label="Urlaub"
          value={formatIstSoll(vacation.used, vacation.budget, percentMode, (v) => String(Math.round(v)))}
          sub={!percentMode ? `${vacation.remaining} Tage offen` : undefined}
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
            {percentMode ? (
              <div className="flex flex-col gap-2 text-[12.5px]">
                {(() => {
                  const total = month.totals.schoolHours + month.totals.homeHours;
                  const schoolPct = total > 0 ? Math.round((month.totals.schoolHours / total) * 100) : 0;
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Schule</span>
                        <span className="tabular text-text-primary">{schoolPct}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Außerschulisch</span>
                        <span className="tabular text-text-primary">{100 - schoolPct}%</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <SplitBar
                segments={[
                  { value: month.totals.schoolHours, color: "var(--accent)", label: "Schule" },
                  { value: month.totals.homeHours, color: "var(--text-tertiary)", label: "Außerschulisch" },
                ]}
              />
            )}
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
                        width: `${Math.min(100, (c.hours / Math.max(maxCategoryHours, 0.01)) * 100)}%`,
                        background: c.color,
                      }}
                    />
                  </div>
                  <span className="w-12 text-right text-[12px] tabular text-text-primary">
                    {percentMode ? `${Math.round((c.hours / Math.max(totalHomeHours, 0.01)) * 100)}%` : `${c.hours}h`}
                  </span>
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
  );
}
