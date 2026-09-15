import { dateInRange, isWeekend, isoDate } from "./time";

export type DayStatus = "KRANK" | "URLAUB" | "FEIERTAG" | "FERIEN" | "WOCHENENDE" | "WERKTAG";

export interface DayContext {
  publicHolidays: Map<string, string>; // isoDate -> Name
  schoolVacations: { startDate: Date; endDate: Date; name: string }[];
  sickLeaves: { startDate: Date; endDate: Date }[];
  vacations: { startDate: Date; endDate: Date }[];
}

export function classifyDay(date: Date, ctx: DayContext): { status: DayStatus; label?: string } {
  if (ctx.sickLeaves.some((s) => dateInRange(date, s.startDate, s.endDate))) {
    return { status: "KRANK" };
  }
  if (ctx.vacations.some((v) => dateInRange(date, v.startDate, v.endDate))) {
    return { status: "URLAUB" };
  }
  const holidayName = ctx.publicHolidays.get(isoDate(date));
  if (holidayName) {
    return { status: "FEIERTAG", label: holidayName };
  }
  const vacation = ctx.schoolVacations.find((v) => dateInRange(date, v.startDate, v.endDate));
  if (vacation) {
    return { status: "FERIEN", label: vacation.name };
  }
  if (isWeekend(date)) {
    return { status: "WOCHENENDE" };
  }
  return { status: "WERKTAG" };
}

// An diesen Tagen findet regulär Unterricht statt (Soll > 0 für Unterricht/Arbeitszeit)
export function isSchoolWorkday(status: DayStatus): boolean {
  return status === "WERKTAG";
}
