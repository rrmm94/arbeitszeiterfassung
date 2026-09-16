import type {
  BlockDefinition,
  DayEntry,
  HomeSegment,
  SchoolSegment,
  Settings,
  TimetableEntry,
  WorkCategory,
} from "@prisma/client";
import { classifyDay, DayContext, DayStatus } from "./day-status";
import { halfYearForDate } from "./school-year";
import { isoWeekday, isoWeekNumber, isWeekend, minutesToHours, segmentMinutes } from "./time";

export type DayEntryWithSegments = DayEntry & {
  schoolSegments: SchoolSegment[];
  homeSegments: (HomeSegment & { category: WorkCategory })[];
};

export interface DayCalcResult {
  date: Date;
  status: DayStatus;
  statusLabel?: string;
  weekNumber: number;
  isSchoolDay: boolean;
  schoolMinutes: number;
  breakMinutes: number;
  homeMinutes: number;
  homeMinutesByCategory: Record<number, number>;
  nettoMinutes: number;
  nettoHours: number;
  blocksWorked: number;
  blocksSoll: number;
  bereitschaftBlocks: number;
  sollMinutes: number;
  sollHours: number;
  diffHours: number;
  hasEntry: boolean;
  noTeachingReason: string | null;
}

export function computeDaySoll(
  date: Date,
  status: DayStatus,
  settings: Settings,
  timetable: TimetableEntry[]
): { sollMinutes: number; blocksSoll: number; bereitschaftBlocks: number } {
  // Die allgemeine Arbeitszeit-Soll (Vergleich zur klassischen 40h-Woche) gilt für jeden
  // Werktag Montag-Freitag, der nicht Feiertag, Krank oder Urlaub ist - Schulferien zählen
  // dabei mit, da sie für die Lehrkraft keine Freizeit sind, sondern reguläre Arbeitszeit
  // (Vor-/Nachbereitung, Fortbildung, ...). Nur Unterrichtsblöcke entfallen in den Ferien.
  // Wochenendtage innerhalb einer Ferienperiode zählen weiterhin als Wochenende (kein Soll).
  const countsTowardGeneralSoll = (status === "WERKTAG" || status === "FERIEN") && !isWeekend(date);
  const sollMinutes = countsTowardGeneralSoll
    ? (settings.compareWeeklyHours * settings.employmentFactor * 60) / 5
    : 0;

  if (status !== "WERKTAG") {
    return { sollMinutes, blocksSoll: 0, bereitschaftBlocks: 0 };
  }
  const halfYear = halfYearForDate(date, settings);
  const weekday = isoWeekday(date);
  const daySlots = timetable.filter((t) => t.halfYear === halfYear && t.weekday === weekday);
  const blocksSoll = daySlots.filter((s) => s.type === "UNTERRICHT").length;
  const bereitschaftBlocks = daySlots.filter((s) => s.type === "BEREITSCHAFT").length;
  return { sollMinutes, blocksSoll, bereitschaftBlocks };
}

export interface SuggestedSchoolPlan {
  segments: { start: string; end: string }[];
  breakMinutes: number;
  blocksSoll: number;
  bereitschaftBlocks: number;
}

/**
 * Leitet aus dem Stundenplan einen Vorschlag für die Schulzeit-Segmente und die
 * Pausenzeit eines Wochentags ab: zusammenhängende Blöcke (Unterricht/Bereitschaft)
 * werden zu einem Zeitraum zusammengefasst, Lücken dazwischen zählen als Pause.
 */
export function getSuggestedSchoolPlan(
  weekday: number,
  halfYear: "HY1" | "HY2",
  blocks: BlockDefinition[],
  timetable: TimetableEntry[]
): SuggestedSchoolPlan {
  const sortedBlocks = [...blocks].sort((a, b) => a.number - b.number);
  const slotsByNumber = new Map(
    timetable.filter((t) => t.halfYear === halfYear && t.weekday === weekday).map((t) => [t.blockNumber, t])
  );

  const segments: { start: string; end: string }[] = [];
  let breakMinutes = 0;
  let current: { start: string; end: string; lastBlockNumber: number } | null = null;

  for (const block of sortedBlocks) {
    const slot = slotsByNumber.get(block.number);
    if (!slot || slot.type === "FREI") continue;

    if (current && current.lastBlockNumber === block.number - 1) {
      breakMinutes += segmentMinutes(current.end, block.startTime);
      current.end = block.endTime;
      current.lastBlockNumber = block.number;
    } else {
      if (current) segments.push({ start: current.start, end: current.end });
      current = { start: block.startTime, end: block.endTime, lastBlockNumber: block.number };
    }
  }
  if (current) segments.push({ start: current.start, end: current.end });

  const daySlots = [...slotsByNumber.values()];
  const blocksSoll = daySlots.filter((s) => s.type === "UNTERRICHT").length;
  const bereitschaftBlocks = daySlots.filter((s) => s.type === "BEREITSCHAFT").length;

  return { segments, breakMinutes, blocksSoll, bereitschaftBlocks };
}

export function computeDay(
  date: Date,
  entry: DayEntryWithSegments | null,
  ctx: DayContext,
  settings: Settings,
  timetable: TimetableEntry[]
): DayCalcResult {
  const { status, label } = classifyDay(date, ctx);
  const { sollMinutes, blocksSoll: baseBlocksSoll, bereitschaftBlocks: baseBereitschaftBlocks } = computeDaySoll(
    date,
    status,
    settings,
    timetable
  );

  // An Tagen ohne Unterricht (z.B. Fortbildung, Exkursion) entfällt die Unterrichtsverpflichtung,
  // die allgemeine Arbeitszeit-Soll (sollMinutes) bleibt davon unberührt.
  const noTeachingReason = entry?.noTeachingReason ?? null;
  const blocksSoll = noTeachingReason ? 0 : baseBlocksSoll;
  const bereitschaftBlocks = noTeachingReason ? 0 : baseBereitschaftBlocks;

  const schoolMinutesRaw = entry?.schoolSegments.reduce((sum, s) => sum + segmentMinutes(s.start, s.end), 0) ?? 0;
  const breakMinutes = entry?.breakMinutes ?? 0;
  const schoolMinutes = Math.max(0, schoolMinutesRaw - breakMinutes);

  const homeMinutesByCategory: Record<number, number> = {};
  let homeMinutes = 0;
  for (const seg of entry?.homeSegments ?? []) {
    const m = segmentMinutes(seg.start, seg.end);
    homeMinutes += m;
    homeMinutesByCategory[seg.categoryId] = (homeMinutesByCategory[seg.categoryId] ?? 0) + m;
  }

  const nettoMinutes = schoolMinutes + homeMinutes;

  // IST-Blöcke werden nur gezählt, wenn für den Tag tatsächlich ein Eintrag existiert -
  // ansonsten würde ein für die Zukunft geplanter Stundenplan fälschlich als bereits
  // geleistete Arbeit in die Berechnung einfließen.
  let blocksWorked = 0;
  if (status === "WERKTAG" && entry) {
    blocksWorked = entry.blocksOverride ?? blocksSoll;
  }

  const nettoHours = minutesToHours(nettoMinutes);
  const sollHours = minutesToHours(sollMinutes);

  return {
    date,
    status,
    statusLabel: label,
    weekNumber: isoWeekNumber(date),
    isSchoolDay: status === "WERKTAG",
    schoolMinutes,
    breakMinutes,
    homeMinutes,
    homeMinutesByCategory,
    nettoMinutes,
    nettoHours,
    blocksWorked,
    blocksSoll,
    bereitschaftBlocks,
    sollMinutes,
    sollHours,
    diffHours: Math.round((nettoHours - sollHours) * 100) / 100,
    hasEntry: !!entry,
    noTeachingReason,
  };
}
