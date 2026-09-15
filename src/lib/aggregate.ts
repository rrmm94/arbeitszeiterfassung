import {
  loadBlockDefinitions,
  loadCategories,
  loadDayEntries,
  loadRangeContext,
  loadSettings,
  loadTimetable,
} from "./data-context";
import { computeDay, DayCalcResult } from "./day-calc";
import { addDays } from "./time";

export function enumerateDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  let cur = start;
  while (cur.getTime() <= end.getTime()) {
    dates.push(cur);
    cur = addDays(cur, 1);
  }
  return dates;
}

export interface RangeSummary {
  days: DayCalcResult[];
  totals: {
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
  };
}

export async function computeRangeSummary(start: Date, end: Date): Promise<RangeSummary> {
  const [settings, blocks, timetable, ctx, entries, categories] = await Promise.all([
    loadSettings(),
    loadBlockDefinitions(),
    loadTimetable(),
    loadRangeContext(start, end),
    loadDayEntries(start, end),
    loadCategories(true),
  ]);
  void blocks;

  const entryByDate = new Map(entries.map((e) => [e.date.toISOString(), e]));

  const days: DayCalcResult[] = enumerateDates(start, end).map((date) => {
    const entry = entryByDate.get(date.toISOString()) ?? null;
    return computeDay(date, entry, ctx, settings, timetable);
  });

  const totals = {
    nettoHours: 0,
    sollHours: 0,
    diffHours: 0,
    blocksWorked: 0,
    blocksSoll: 0,
    schoolHours: 0,
    homeHours: 0,
    homeHoursByCategory: [] as { categoryId: number; name: string; color: string; hours: number }[],
    weekendHours: 0,
    holidayHours: 0,
    ferienHours: 0,
    sickDays: 0,
    vacationDaysUsed: 0,
    workdayCount: 0,
  };

  const categoryMinutes = new Map<number, number>();

  for (const day of days) {
    totals.nettoHours += day.nettoHours;
    totals.sollHours += day.sollHours;
    totals.blocksWorked += day.blocksWorked;
    totals.blocksSoll += day.blocksSoll;
    totals.schoolHours += day.schoolMinutes / 60;
    totals.homeHours += day.homeMinutes / 60;
    if (day.status === "WERKTAG") totals.workdayCount++;
    if (day.status === "KRANK") totals.sickDays++;
    if (day.status === "URLAUB") totals.vacationDaysUsed++;
    if (day.status === "WOCHENENDE") totals.weekendHours += day.nettoHours;
    if (day.status === "FEIERTAG") totals.holidayHours += day.nettoHours;
    if (day.status === "FERIEN") totals.ferienHours += day.nettoHours;

    for (const [catId, mins] of Object.entries(day.homeMinutesByCategory)) {
      categoryMinutes.set(Number(catId), (categoryMinutes.get(Number(catId)) ?? 0) + mins);
    }
  }

  totals.diffHours = Math.round((totals.nettoHours - totals.sollHours) * 100) / 100;
  totals.nettoHours = Math.round(totals.nettoHours * 100) / 100;
  totals.sollHours = Math.round(totals.sollHours * 100) / 100;
  totals.schoolHours = Math.round(totals.schoolHours * 100) / 100;
  totals.homeHours = Math.round(totals.homeHours * 100) / 100;
  totals.weekendHours = Math.round(totals.weekendHours * 100) / 100;
  totals.holidayHours = Math.round(totals.holidayHours * 100) / 100;
  totals.ferienHours = Math.round(totals.ferienHours * 100) / 100;

  totals.homeHoursByCategory = categories
    .map((c) => ({
      categoryId: c.id,
      name: c.name,
      color: c.color,
      hours: Math.round(((categoryMinutes.get(c.id) ?? 0) / 60) * 100) / 100,
    }))
    .filter((c) => c.hours > 0)
    .sort((a, b) => b.hours - a.hours);

  return { days, totals };
}
