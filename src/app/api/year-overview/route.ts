import { bucketByMonth, computeRangeSummary } from "@/lib/aggregate";
import { loadSettings } from "@/lib/data-context";
import { monthKey, schoolYearRange, schoolYearStartYear } from "@/lib/school-year";
import { addDays, todayDateOnly } from "@/lib/time";
import { NextResponse } from "next/server";

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const settings = await loadSettings();

  const startYearParam = searchParams.get("startYear");
  const startYear = startYearParam ? Number(startYearParam) : schoolYearStartYear(todayDateOnly(), settings);

  const { start, end } = schoolYearRange(startYear, settings);
  const summary = await computeRangeSummary(start, end);
  const buckets = bucketByMonth(summary.days);
  const bucketByKey = new Map(buckets.map((b) => [b.key, b]));

  const months = [];
  for (let i = 0; i < 12; i++) {
    const date = addDays(start, 0);
    date.setUTCMonth(date.getUTCMonth() + i);
    const key = monthKey(date);
    const bucket = bucketByKey.get(key);
    months.push({
      key,
      label: MONTH_NAMES[date.getUTCMonth()],
      year: date.getUTCFullYear(),
      nettoHours: bucket?.nettoHours ?? 0,
      sollHours: bucket?.sollHours ?? 0,
      blocksWorked: bucket?.blocksWorked ?? 0,
      blocksSoll: bucket?.blocksSoll ?? 0,
      workdayCount: bucket?.workdayCount ?? 0,
    });
  }

  return NextResponse.json({
    startYear,
    months,
    totals: summary.totals,
  });
}
