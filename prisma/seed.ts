import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  await db.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  const blocks = [
    { number: 1, label: "1. Block", startTime: "08:00", endTime: "09:15" },
    { number: 2, label: "2. Block", startTime: "09:45", endTime: "11:00" },
    { number: 3, label: "3. Block", startTime: "11:00", endTime: "12:15" },
    { number: 4, label: "4. Block", startTime: "13:15", endTime: "14:30" },
  ];
  for (const b of blocks) {
    await db.blockDefinition.upsert({
      where: { number: b.number },
      update: {},
      create: b,
    });
  }

  const categories = [
    { name: "Unterrichtsvorbereitung", color: "#3b82f6", sortOrder: 1 },
    { name: "Materialerstellung", color: "#8b5cf6", sortOrder: 2 },
    { name: "Korrekturen", color: "#ef4444", sortOrder: 3 },
    { name: "Fortbildung", color: "#f59e0b", sortOrder: 4 },
    { name: "Elterngespräch", color: "#10b981", sortOrder: 5 },
    { name: "Dienstbesprechung", color: "#06b6d4", sortOrder: 6 },
    { name: "Konferenz", color: "#6366f1", sortOrder: 7 },
    { name: "Exkursion", color: "#84cc16", sortOrder: 8 },
    { name: "Sonstiges", color: "#6b7280", sortOrder: 99 },
  ];
  for (const c of categories) {
    await db.workCategory.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
  }
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
