import { db } from "@/lib/db";
import { parseIsoDate } from "@/lib/time";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const item = await db.vacation.update({
    where: { id: Number(id) },
    data: {
      startDate: parseIsoDate(body.startDate),
      endDate: parseIsoDate(body.endDate ?? body.startDate),
      note: body.note || null,
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.vacation.delete({ where: { id: Number(id) } });
  return NextResponse.json({ deleted: true });
}
