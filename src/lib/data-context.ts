import { db } from "./db";

export async function loadSettings() {
  let settings = await db.settings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await db.settings.create({ data: { id: 1 } });
  }
  return settings;
}

export async function loadBlockDefinitions() {
  return db.blockDefinition.findMany({ orderBy: { number: "asc" } });
}

export async function loadTimetable() {
  return db.timetableEntry.findMany();
}

export async function loadCategories(includeArchived = false) {
  return db.workCategory.findMany({
    where: includeArchived ? {} : { archived: false },
    orderBy: { sortOrder: "asc" },
  });
}

export async function loadRangeContext(start: Date, end: Date) {
  const [publicHolidaysRaw, schoolVacations, sickLeaves, vacations] = await Promise.all([
    db.publicHoliday.findMany({ where: { date: { gte: start, lte: end } } }),
    db.schoolVacation.findMany({
      where: { AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }] },
    }),
    db.sickLeave.findMany({
      where: { AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }] },
    }),
    db.vacation.findMany({
      where: { AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }] },
    }),
  ]);

  const publicHolidays = new Map<string, string>();
  for (const h of publicHolidaysRaw) {
    const iso = h.date.toISOString().slice(0, 10);
    publicHolidays.set(iso, h.name);
  }

  return { publicHolidays, schoolVacations, sickLeaves, vacations };
}

export async function loadDayEntries(start: Date, end: Date) {
  return db.dayEntry.findMany({
    where: { date: { gte: start, lte: end } },
    include: {
      schoolSegments: true,
      homeSegments: { include: { category: true } },
    },
  });
}
