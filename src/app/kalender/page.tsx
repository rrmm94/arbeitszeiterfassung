"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui";
import { useEntryModal } from "@/components/entry-modal-provider";
import type { DayComputedDTO, DayStatus } from "@/lib/api-types";
import { formatHours } from "@/lib/time";

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const STATUS_BG: Record<DayStatus, string> = {
  WERKTAG: "",
  WOCHENENDE: "var(--status-weekend-bg)",
  FEIERTAG: "var(--status-holiday-bg)",
  FERIEN: "var(--status-ferien-bg)",
  KRANK: "var(--status-krank-bg)",
  URLAUB: "var(--status-urlaub-bg)",
};
const STATUS_FG: Record<DayStatus, string> = {
  WERKTAG: "var(--text-tertiary)",
  WOCHENENDE: "var(--status-weekend-fg)",
  FEIERTAG: "var(--status-holiday-fg)",
  FERIEN: "var(--status-ferien-fg)",
  KRANK: "var(--status-krank-fg)",
  URLAUB: "var(--status-urlaub-fg)",
};

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [days, setDays] = useState<DayComputedDTO[]>([]);
  const { openEntryModal } = useEntryModal();
  const today = todayIso();

  const load = useCallback(async () => {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const res = await fetch(`/api/calendar?month=${key}`);
    const data = await res.json();
    setDays(data.days);
  }, [year, month]);

  useEffect(() => {
    load();
    window.addEventListener("day-entry-updated", load);
    return () => window.removeEventListener("day-entry-updated", load);
  }, [load]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1);
  }
  function goToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  }

  const grid = useMemo(() => {
    if (days.length === 0) return [];
    const firstDate = new Date(year, month - 1, 1);
    const firstWeekday = (firstDate.getDay() + 6) % 7; // 0=Montag
    const cells: (DayComputedDTO | null)[] = Array(firstWeekday).fill(null);
    for (const d of days) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (DayComputedDTO | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }, [days, year, month]);

  return (
    <div>
      <PageHeader
        title="Kalender"
        subtitle={`${MONTH_NAMES[month - 1]} ${year}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={goToday}>Heute</Button>
            <div className="flex items-center rounded-md border border-border">
              <button onClick={prevMonth} className="p-1.5 text-text-secondary hover:bg-bg-hover">
                <ChevronLeft size={15} />
              </button>
              <button onClick={nextMonth} className="p-1.5 text-text-secondary hover:bg-bg-hover">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        }
      />

      <div className="p-4 sm:p-8">
        <div className="mb-2 grid grid-cols-7 gap-2">
          {WEEKDAY_LABELS.map((w) => (
            <div key={w} className="px-1 text-[11.5px] font-medium uppercase tracking-wide text-text-tertiary">
              {w}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {grid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-2">
              {week.map((day, di) => {
                if (!day) return <div key={di} />;
                const isToday = day.date === today;
                return (
                  <button
                    key={di}
                    onClick={() => openEntryModal(day.date)}
                    style={{ background: STATUS_BG[day.status] || "var(--bg-panel)" }}
                    className={`flex min-h-[92px] flex-col rounded-lg border p-2 text-left transition-shadow hover:shadow-md ${
                      isToday ? "border-accent" : "border-border"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={`text-[12.5px] tabular ${isToday ? "font-semibold text-accent" : "text-text-primary"}`}
                      >
                        {Number(day.date.slice(8, 10))}
                      </span>
                      {day.status !== "WERKTAG" && (
                        <span
                          className="text-[9.5px] font-medium uppercase tracking-wide"
                          style={{ color: STATUS_FG[day.status] }}
                        >
                          {day.status === "WOCHENENDE" ? "" : day.status.slice(0, 3)}
                        </span>
                      )}
                    </div>
                    {(day.nettoHours > 0 || day.hasEntry) && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[12px] tabular text-text-primary">{formatHours(day.nettoHours)}</span>
                        {day.status === "WERKTAG" && (
                          <span className="text-[10.5px] tabular text-text-tertiary">
                            {day.blocksWorked}/{day.blocksSoll} Blöcke
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          {(["WERKTAG", "WOCHENENDE", "FEIERTAG", "FERIEN", "KRANK", "URLAUB"] as DayStatus[]).map((s) => (
            <div key={s} className="flex items-center gap-1.5 text-[11.5px] text-text-secondary">
              <span
                className="h-2.5 w-2.5 rounded-full border border-border"
                style={{ background: STATUS_BG[s] || "var(--bg-panel)" }}
              />
              {{
                WERKTAG: "Werktag",
                WOCHENENDE: "Wochenende",
                FEIERTAG: "Feiertag",
                FERIEN: "Ferien",
                KRANK: "Krank",
                URLAUB: "Urlaub",
              }[s]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
