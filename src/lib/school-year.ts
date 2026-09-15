import type { Settings } from "@prisma/client";
import { dateOnly } from "./time";

/**
 * Das Schuljahr läuft von schoolYearStartMonth (z.B. August) bis Ende Juli des Folgejahres.
 * Gibt das "Start-Jahr" des Schuljahres zurück, in dem das Datum liegt.
 */
export function schoolYearStartYear(date: Date, settings: Pick<Settings, "schoolYearStartMonth">): number {
  const month = date.getUTCMonth() + 1; // 1-12
  return month >= settings.schoolYearStartMonth ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
}

export function schoolYearRange(
  startYear: number,
  settings: Pick<Settings, "schoolYearStartMonth">
): { start: Date; end: Date } {
  const start = dateOnly(startYear, settings.schoolYearStartMonth, 1);
  const end = dateOnly(startYear + 1, settings.schoolYearStartMonth, 0); // letzter Tag vor Start
  return { start, end };
}

export function halfYearForDate(
  date: Date,
  settings: Pick<Settings, "schoolYearStartMonth" | "halfYearSwitchMonth" | "halfYearSwitchDay">
): "HY1" | "HY2" {
  const y = schoolYearStartYear(date, settings);
  const switchDate = dateOnly(y + 1, settings.halfYearSwitchMonth, settings.halfYearSwitchDay);
  return date.getTime() < switchDate.getTime() ? "HY1" : "HY2";
}

export const MONTHS_SCHOOL_YEAR = [
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
];

export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}`;
}
