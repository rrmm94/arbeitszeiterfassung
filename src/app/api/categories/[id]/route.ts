import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const category = await db.workCategory.update({
    where: { id: Number(id) },
    data: {
      name: body.name,
      color: body.color,
      archived: body.archived,
      sortOrder: body.sortOrder,
    },
  });
  return NextResponse.json(category);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usageCount = await db.homeSegment.count({ where: { categoryId: Number(id) } });
  if (usageCount > 0) {
    // Kategorie wird bereits verwendet -> nur archivieren statt löschen
    const category = await db.workCategory.update({
      where: { id: Number(id) },
      data: { archived: true },
    });
    return NextResponse.json({ archived: true, category });
  }
  await db.workCategory.delete({ where: { id: Number(id) } });
  return NextResponse.json({ deleted: true });
}
