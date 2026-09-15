import { db } from "@/lib/db";
import { parseIsoDate } from "@/lib/time";
import { NextResponse } from "next/server";

export async function GET() {
  const [publicHolidays, schoolVacations] = await Promise.all([
    db.publicHoliday.findMany({ orderBy: { date: "asc" } }),
    db.schoolVacation.findMany({ orderBy: { startDate: "asc" } }),
  ]);
  return NextResponse.json({ publicHolidays, schoolVacations });
}

export async function POST(req: Request) {
  const body = await req.json();

  if (body.kind === "public") {
    const holiday = await db.publicHoliday.create({
      data: { date: parseIsoDate(body.date), name: body.name, source: "manual" },
    });
    return NextResponse.json(holiday, { status: 201 });
  }

  if (body.kind === "school") {
    const vacation = await db.schoolVacation.create({
      data: {
        startDate: parseIsoDate(body.startDate),
        endDate: parseIsoDate(body.endDate),
        name: body.name,
        source: "manual",
      },
    });
    return NextResponse.json(vacation, { status: 201 });
  }

  return NextResponse.json({ error: "Ungültiger kind" }, { status: 400 });
}
