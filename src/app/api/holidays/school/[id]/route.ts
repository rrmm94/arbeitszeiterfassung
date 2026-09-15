import { db } from "@/lib/db";
import { parseIsoDate } from "@/lib/time";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const vacation = await db.schoolVacation.update({
    where: { id: Number(id) },
    data: {
      name: body.name,
      startDate: body.startDate ? parseIsoDate(body.startDate) : undefined,
      endDate: body.endDate ? parseIsoDate(body.endDate) : undefined,
      source: "manual",
    },
  });
  return NextResponse.json(vacation);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.schoolVacation.delete({ where: { id: Number(id) } });
  return NextResponse.json({ deleted: true });
}
