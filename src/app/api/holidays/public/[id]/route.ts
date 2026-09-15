import { db } from "@/lib/db";
import { parseIsoDate } from "@/lib/time";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const holiday = await db.publicHoliday.update({
    where: { id: Number(id) },
    data: { name: body.name, date: body.date ? parseIsoDate(body.date) : undefined, source: "manual" },
  });
  return NextResponse.json(holiday);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.publicHoliday.delete({ where: { id: Number(id) } });
  return NextResponse.json({ deleted: true });
}
