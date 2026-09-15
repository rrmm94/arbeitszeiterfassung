import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const categories = await db.workCategory.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Name erforderlich" }, { status: 400 });
  }
  const maxSort = await db.workCategory.aggregate({ _max: { sortOrder: true } });
  const category = await db.workCategory.create({
    data: {
      name: body.name,
      color: body.color ?? "#6b7280",
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });
  return NextResponse.json(category, { status: 201 });
}
