import { db } from "@/lib/db";
import { loadSettings } from "@/lib/data-context";
import { NextResponse } from "next/server";

export async function GET() {
  const settings = await loadSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const body = await req.json();

  const data = {
    fullTimeUE: Number(body.fullTimeUE),
    fullTimeBlocks: Number(body.fullTimeBlocks),
    employmentFactor: Number(body.employmentFactor),
    compareWeeklyHours: Number(body.compareWeeklyHours),
    compareVacationDays: Number(body.compareVacationDays),
    vacationDaysPerYear: Number(body.vacationDaysPerYear),
    schoolYearStartMonth: Number(body.schoolYearStartMonth),
    halfYearSwitchMonth: Number(body.halfYearSwitchMonth),
    halfYearSwitchDay: Number(body.halfYearSwitchDay),
    federalState: String(body.federalState),
  };

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "number" && Number.isNaN(value)) {
      return NextResponse.json({ error: `Ungültiger Wert für ${key}` }, { status: 400 });
    }
  }

  const settings = await db.settings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  return NextResponse.json(settings);
}
