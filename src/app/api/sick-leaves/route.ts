import { db } from "@/lib/db";
import { parseIsoDate } from "@/lib/time";
import { NextResponse } from "next/server";

export async function GET() {
  const items = await db.sickLeave.findMany({ orderBy: { startDate: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const item = await db.sickLeave.create({
    data: {
      startDate: parseIsoDate(body.startDate),
      endDate: parseIsoDate(body.endDate ?? body.startDate),
      note: body.note || null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
