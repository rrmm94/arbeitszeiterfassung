import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const blocks = await db.blockDefinition.findMany({ orderBy: { number: "asc" } });
  return NextResponse.json(blocks);
}

export async function PUT(req: Request) {
  const body: { number: number; label: string; startTime: string; endTime: string }[] = await req.json();

  const results = [];
  for (const b of body) {
    results.push(
      await db.blockDefinition.upsert({
        where: { number: b.number },
        update: { label: b.label, startTime: b.startTime, endTime: b.endTime },
        create: b,
      })
    );
  }
  return NextResponse.json(results);
}
