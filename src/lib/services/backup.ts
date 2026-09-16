import { db } from "@/lib/db";

const BACKUP_VERSION = 1;

export async function exportBackup() {
  const [
    settings,
    blockDefinitions,
    timetableEntries,
    workCategories,
    publicHolidays,
    schoolVacations,
    sickLeaves,
    vacations,
    dayEntries,
  ] = await Promise.all([
    db.settings.findUnique({ where: { id: 1 } }),
    db.blockDefinition.findMany(),
    db.timetableEntry.findMany(),
    db.workCategory.findMany(),
    db.publicHoliday.findMany(),
    db.schoolVacation.findMany(),
    db.sickLeave.findMany(),
    db.vacation.findMany(),
    db.dayEntry.findMany({ include: { schoolSegments: true, homeSegments: true } }),
  ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    blockDefinitions,
    timetableEntries,
    workCategories,
    publicHolidays,
    schoolVacations,
    sickLeaves,
    vacations,
    dayEntries,
  };
}

export type BackupData = Awaited<ReturnType<typeof exportBackup>>;

export async function importBackup(data: BackupData) {
  if (!data || typeof data !== "object" || !Array.isArray(data.dayEntries)) {
    throw new Error("Ungültiges Backup-Format");
  }

  await db.$transaction(
    async (tx) => {
      // Kinder zuerst löschen (Fremdschlüssel-Reihenfolge)
      await tx.homeSegment.deleteMany();
      await tx.schoolSegment.deleteMany();
      await tx.dayEntry.deleteMany();
      await tx.timetableEntry.deleteMany();
      await tx.workCategory.deleteMany();
      await tx.sickLeave.deleteMany();
      await tx.vacation.deleteMany();
      await tx.schoolVacation.deleteMany();
      await tx.publicHoliday.deleteMany();
      await tx.blockDefinition.deleteMany();
      await tx.settings.deleteMany();

      if (data.settings) {
        await tx.settings.create({ data: { ...data.settings, id: 1 } });
      }
      for (const b of data.blockDefinitions ?? []) {
        await tx.blockDefinition.create({ data: b });
      }
      for (const c of data.workCategories ?? []) {
        await tx.workCategory.create({ data: c });
      }
      for (const t of data.timetableEntries ?? []) {
        await tx.timetableEntry.create({ data: t });
      }
      for (const h of data.publicHolidays ?? []) {
        await tx.publicHoliday.create({ data: { ...h, date: new Date(h.date) } });
      }
      for (const v of data.schoolVacations ?? []) {
        await tx.schoolVacation.create({
          data: { ...v, startDate: new Date(v.startDate), endDate: new Date(v.endDate) },
        });
      }
      for (const s of data.sickLeaves ?? []) {
        await tx.sickLeave.create({
          data: { ...s, startDate: new Date(s.startDate), endDate: new Date(s.endDate) },
        });
      }
      for (const v of data.vacations ?? []) {
        await tx.vacation.create({
          data: { ...v, startDate: new Date(v.startDate), endDate: new Date(v.endDate) },
        });
      }
      for (const entry of data.dayEntries) {
        const { schoolSegments, homeSegments, ...entryFields } = entry;
        await tx.dayEntry.create({
          data: {
            ...entryFields,
            date: new Date(entryFields.date),
            createdAt: new Date(entryFields.createdAt),
            updatedAt: new Date(entryFields.updatedAt),
            schoolSegments: {
              create: schoolSegments.map((s) => ({ start: s.start, end: s.end, isExtra: s.isExtra, reason: s.reason })),
            },
            homeSegments: {
              create: homeSegments.map((s) => ({
                start: s.start,
                end: s.end,
                categoryId: s.categoryId,
                description: s.description,
              })),
            },
          },
        });
      }
    },
    { timeout: 30000 }
  );

  return {
    dayEntries: data.dayEntries.length,
    workCategories: data.workCategories?.length ?? 0,
    timetableEntries: data.timetableEntries?.length ?? 0,
  };
}
