import { computeRangeSummary } from "@/lib/aggregate";
import { loadSettings } from "@/lib/data-context";
import { db } from "@/lib/db";
import { schoolYearRange, schoolYearStartYear } from "@/lib/school-year";
import { addDays, dateOnly, isoDate, todayDateOnly } from "@/lib/time";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  const today = todayDateOnly();

  const [y, m] = monthParam && /^\d{4}-\d{2}$/.test(monthParam)
    ? monthParam.split("-").map(Number)
    : [today.getUTCFullYear(), today.getUTCMonth() + 1];

  const monthStart = dateOnly(y, m, 1);
  const monthEnd = dateOnly(y, m + 1, 0);

  const settings = await loadSettings();
  const startYear = schoolYearStartYear(today, settings);
  const { start: schoolYearStart, end: schoolYearEnd } = schoolYearRange(startYear, settings);

  const weeksRangeStart = addDays(today, -7 * 9);

  const [monthSummary, schoolYearSummary, weeksSummary, vacationTaken] = await Promise.all([
    computeRangeSummary(monthStart, monthEnd),
    computeRangeSummary(schoolYearStart, schoolYearEnd < today ? schoolYearEnd : today),
    computeRangeSummary(weeksRangeStart, today),
    db.vacation.findMany({
      where: { AND: [{ startDate: { lte: schoolYearEnd } }, { endDate: { gte: schoolYearStart } }] },
    }),
  ]);

  const weekBuckets = new Map<string, { weekNumber: number; nettoHours: number; sollHours: number }>();
  for (const day of weeksSummary.days) {
    const key = `${day.date.getUTCFullYear()}-${day.weekNumber}`;
    const bucket = weekBuckets.get(key) ?? { weekNumber: day.weekNumber, nettoHours: 0, sollHours: 0 };
    bucket.nettoHours += day.nettoHours;
    bucket.sollHours += day.sollHours;
    weekBuckets.set(key, bucket);
  }
  const weeks = [...weekBuckets.entries()]
    .map(([key, v]) => ({
      key,
      weekNumber: v.weekNumber,
      nettoHours: Math.round(v.nettoHours * 100) / 100,
      sollHours: Math.round(v.sollHours * 100) / 100,
    }))
    .slice(-8);

  let vacationDaysUsed = 0;
  for (const v of vacationTaken) {
    const start = v.startDate < schoolYearStart ? schoolYearStart : v.startDate;
    const end = v.endDate > schoolYearEnd ? schoolYearEnd : v.endDate;
    let cur = start;
    while (cur.getTime() <= end.getTime()) {
      const day = cur.getUTCDay();
      if (day !== 0 && day !== 6) vacationDaysUsed++;
      cur = addDays(cur, 1);
    }
  }

  return NextResponse.json({
    month: { key: `${y}-${String(m).padStart(2, "0")}`, totals: monthSummary.totals },
    schoolYear: {
      startYear,
      totals: schoolYearSummary.totals,
      range: { start: isoDate(schoolYearStart), end: isoDate(schoolYearEnd) },
    },
    weeks,
    vacation: {
      used: vacationDaysUsed,
      budget: settings.vacationDaysPerYear,
      remaining: Math.round((settings.vacationDaysPerYear - vacationDaysUsed) * 10) / 10,
    },
    settings,
  });
}
