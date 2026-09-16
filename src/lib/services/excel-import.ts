import * as XLSX from "xlsx";
import { db } from "@/lib/db";

const MONTH_SHEETS = [
  "August", "September", "Oktober", "November", "Dezember", "Januar",
  "Februar", "März", "April", "Mai", "Juni", "Juli",
];

const IMPORT_CATEGORY_NAME = "Zusatzarbeit (Import)";

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);

function serialToUtcDate(serial: number): Date {
  return new Date(EXCEL_EPOCH_UTC + Math.round(serial * 86400000));
}

function serialToHHMM(serial: number): string {
  const totalMinutes = Math.round(((serial % 1) + 1) % 1 * 24 * 60);
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function serialToMinutes(serial: number): number {
  return Math.round(((serial % 1) + 1) % 1 * 24 * 60);
}

interface Segment {
  start: string;
  end: string;
}

interface ImportedDay {
  date: Date;
  // Spalten D/E: tatsächliche Zeit in der Schule
  schoolSegments: Segment[];
  // Spalten F/G und H/I ("Zusatz 1"/"Zusatz 2"): zusätzliche Arbeit, nicht zwingend an der Schule
  extraSegments: Segment[];
  breakMinutes: number;
  blocksOverride: number | null;
  note: string | null;
  absence: "Ferien" | "Feiertag" | "Krank" | "Urlaub" | null;
}

function cellNumber(sheet: XLSX.WorkSheet, addr: string): number | null {
  const cell = sheet[addr];
  if (!cell || typeof cell.v !== "number") return null;
  return cell.v;
}

function cellText(sheet: XLSX.WorkSheet, addr: string): string | null {
  const cell = sheet[addr];
  if (!cell || cell.v === undefined || cell.v === null || cell.v === "") return null;
  return String(cell.v).trim();
}

function readSegment(sheet: XLSX.WorkSheet, row: number, startCol: string, endCol: string): Segment | null {
  const s = cellNumber(sheet, `${startCol}${row}`);
  const e = cellNumber(sheet, `${endCol}${row}`);
  if (s === null || e === null) return null;
  return { start: serialToHHMM(s), end: serialToHHMM(e) };
}

export function parseWorkbook(buffer: ArrayBuffer): ImportedDay[] {
  const wb = XLSX.read(buffer, { type: "buffer", cellFormula: false });
  const days: ImportedDay[] = [];

  for (const sheetName of MONTH_SHEETS) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;

    for (let row = 8; row <= 38; row++) {
      const dateSerial = cellNumber(sheet, `B${row}`);
      if (dateSerial === null) continue;
      const date = serialToUtcDate(dateSerial);

      const schoolSegments: Segment[] = [];
      const schoolSeg = readSegment(sheet, row, "D", "E");
      if (schoolSeg) schoolSegments.push(schoolSeg);

      const extraSegments: Segment[] = [];
      for (const [startCol, endCol] of [["F", "G"], ["H", "I"]] as [string, string][]) {
        const seg = readSegment(sheet, row, startCol, endCol);
        if (seg) extraSegments.push(seg);
      }

      const pauseSerial = cellNumber(sheet, `J${row}`);
      const breakMinutes = pauseSerial !== null ? serialToMinutes(pauseSerial) : 0;
      const blocksOverride = cellNumber(sheet, `M${row}`);
      const note = cellText(sheet, `P${row}`);
      const absence = cellText(sheet, `N${row}`) as ImportedDay["absence"];

      if (schoolSegments.length === 0 && extraSegments.length === 0 && !blocksOverride && !note && !absence) {
        continue;
      }

      days.push({ date, schoolSegments, extraSegments, breakMinutes, blocksOverride, note, absence });
    }
  }

  return days;
}

function groupConsecutiveDates(dates: Date[]): { startDate: Date; endDate: Date }[] {
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const ranges: { startDate: Date; endDate: Date }[] = [];
  for (const d of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && d.getTime() - last.endDate.getTime() === 86400000) {
      last.endDate = d;
    } else {
      ranges.push({ startDate: d, endDate: d });
    }
  }
  return ranges;
}

async function ensureImportCategory(): Promise<number> {
  const existing = await db.workCategory.findUnique({ where: { name: IMPORT_CATEGORY_NAME } });
  if (existing) return existing.id;
  const maxSort = await db.workCategory.aggregate({ _max: { sortOrder: true } });
  const created = await db.workCategory.create({
    data: { name: IMPORT_CATEGORY_NAME, color: "#9ca3af", sortOrder: (maxSort._max.sortOrder ?? 0) + 1 },
  });
  return created.id;
}

export async function importExcelBuffer(buffer: ArrayBuffer) {
  const days = parseWorkbook(buffer);
  const importCategoryId = await ensureImportCategory();

  const sickDates = days.filter((d) => d.absence === "Krank").map((d) => d.date);
  const urlaubDates = days.filter((d) => d.absence === "Urlaub").map((d) => d.date);

  let sickRangesCreated = 0;
  for (const range of groupConsecutiveDates(sickDates)) {
    const exists = await db.sickLeave.findFirst({ where: { startDate: range.startDate, endDate: range.endDate } });
    if (!exists) {
      await db.sickLeave.create({ data: { ...range, note: "Import aus Excel" } });
      sickRangesCreated++;
    }
  }

  let vacationRangesCreated = 0;
  for (const range of groupConsecutiveDates(urlaubDates)) {
    const exists = await db.vacation.findFirst({ where: { startDate: range.startDate, endDate: range.endDate } });
    if (!exists) {
      await db.vacation.create({ data: { ...range, note: "Import aus Excel" } });
      vacationRangesCreated++;
    }
  }

  let entriesCreated = 0;
  let entriesSkipped = 0;
  for (const day of days) {
    if (day.absence === "Krank") continue; // keine Arbeitszeit an Krankheitstagen
    if (day.schoolSegments.length === 0 && day.extraSegments.length === 0 && !day.blocksOverride && !day.note) {
      continue;
    }

    const existing = await db.dayEntry.findUnique({ where: { date: day.date } });
    if (existing) {
      entriesSkipped++;
      continue;
    }

    // An Schule findet an Urlaubstagen nicht statt, Zusatzarbeit (außerschulisch) bleibt möglich.
    const schoolSegments = day.absence === "Urlaub" ? [] : day.schoolSegments;

    await db.dayEntry.create({
      data: {
        date: day.date,
        breakMinutes: day.absence === "Urlaub" ? 0 : day.breakMinutes,
        blocksOverride: day.absence === "Urlaub" ? null : day.blocksOverride,
        note: day.note,
        schoolSegments: {
          create: schoolSegments.map((s) => ({ start: s.start, end: s.end, isExtra: false })),
        },
        homeSegments: {
          create: day.extraSegments.map((s) => ({
            start: s.start,
            end: s.end,
            categoryId: importCategoryId,
          })),
        },
      },
    });
    entriesCreated++;
  }

  return { entriesCreated, entriesSkipped, sickRangesCreated, vacationRangesCreated };
}
