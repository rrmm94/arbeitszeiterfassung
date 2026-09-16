import { db } from "@/lib/db";
import { addDays, parseIsoDate } from "@/lib/time";
import { NextResponse } from "next/server";

// Markiert einen Zeitraum als "kein Unterricht" (z.B. Fortbildung, Exkursion, dienstliche
// Abwesenheit): Unterrichtsblöcke-Soll entfällt für diese Tage, die reguläre Schulzeit wird
// entfernt. Bereits erfasste außerschulische Arbeit an diesen Tagen bleibt erhalten.
export async function POST(req: Request) {
  const body = await req.json();
  const reason: string = (body.reason || "Fortbildung").trim();
  const start = parseIsoDate(body.startDate);
  const end = parseIsoDate(body.endDate ?? body.startDate);

  if (end.getTime() < start.getTime()) {
    return NextResponse.json({ error: "Enddatum liegt vor dem Startdatum" }, { status: 400 });
  }

  let updated = 0;
  for (let d = start; d.getTime() <= end.getTime(); d = addDays(d, 1)) {
    const date = d;
    await db.$transaction(async (tx) => {
      const entry = await tx.dayEntry.upsert({
        where: { date },
        update: {
          noTeachingReason: reason,
          blocksOverride: null,
          blocksOverrideReason: null,
          breakMinutes: 0,
        },
        create: { date, noTeachingReason: reason },
      });
      await tx.schoolSegment.deleteMany({ where: { dayEntryId: entry.id } });
    });
    updated++;
  }

  return NextResponse.json({ updated });
}
