import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const halfYear = searchParams.get("halfYear");
  const entries = await db.timetableEntry.findMany({
    where: halfYear ? { halfYear: halfYear as "HY1" | "HY2" } : undefined,
  });
  return NextResponse.json(entries);
}

interface SlotInput {
  halfYear: "HY1" | "HY2";
  weekday: number;
  blockNumber: number;
  type: "UNTERRICHT" | "BEREITSCHAFT" | "FREI";
  subject?: string | null;
  room?: string | null;
}

export async function PUT(req: Request) {
  const body: SlotInput[] = await req.json();

  const results = [];
  for (const slot of body) {
    if (slot.type === "FREI") {
      await db.timetableEntry.deleteMany({
        where: { halfYear: slot.halfYear, weekday: slot.weekday, blockNumber: slot.blockNumber },
      });
      continue;
    }
    results.push(
      await db.timetableEntry.upsert({
        where: {
          halfYear_weekday_blockNumber: {
            halfYear: slot.halfYear,
            weekday: slot.weekday,
            blockNumber: slot.blockNumber,
          },
        },
        update: { type: slot.type, subject: slot.subject, room: slot.room },
        create: slot,
      })
    );
  }
  return NextResponse.json(results);
}
