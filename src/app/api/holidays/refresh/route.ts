import { loadSettings } from "@/lib/data-context";
import { refreshHolidays } from "@/lib/services/holidays";
import { schoolYearRange, schoolYearStartYear } from "@/lib/school-year";
import { todayDateOnly } from "@/lib/time";
import { NextResponse } from "next/server";

export async function POST() {
  const settings = await loadSettings();
  const currentStartYear = schoolYearStartYear(todayDateOnly(), settings);
  const { start } = schoolYearRange(currentStartYear, settings);
  const { end } = schoolYearRange(currentStartYear + 1, settings);

  try {
    const result = await refreshHolidays(settings.federalState, start, end);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unbekannter Fehler" },
      { status: 502 }
    );
  }
}
