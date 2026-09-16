import { db } from "@/lib/db";
import { loadBlockDefinitions, loadRangeContext, loadSettings, loadTimetable } from "@/lib/data-context";
import { computeDay, getSuggestedSchoolPlan } from "@/lib/day-calc";
import { classifyDay } from "@/lib/day-status";
import { halfYearForDate } from "@/lib/school-year";
import { isoWeekday, parseIsoDate } from "@/lib/time";
import { NextResponse } from "next/server";

function isValidDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function GET(_req: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date: dateStr } = await params;
  if (!isValidDate(dateStr)) {
    return NextResponse.json({ error: "Ungültiges Datum" }, { status: 400 });
  }
  const date = parseIsoDate(dateStr);

  const [settings, blocks, timetable, ctx, entry] = await Promise.all([
    loadSettings(),
    loadBlockDefinitions(),
    loadTimetable(),
    loadRangeContext(date, date),
    db.dayEntry.findUnique({
      where: { date },
      include: { schoolSegments: true, homeSegments: { include: { category: true } } },
    }),
  ]);

  const computed = computeDay(date, entry, ctx, settings, timetable);
  const { status } = classifyDay(date, ctx);
  const halfYear = halfYearForDate(date, settings);
  const weekday = isoWeekday(date);
  const suggested =
    status === "WERKTAG" ? getSuggestedSchoolPlan(weekday, halfYear, blocks, timetable) : null;

  return NextResponse.json({ entry, computed, suggested, weekday, halfYear });
}

interface SchoolSegmentInput {
  start: string;
  end: string;
  isExtra?: boolean;
  reason?: string | null;
}

interface HomeSegmentInput {
  start: string;
  end: string;
  categoryId: number;
  description?: string | null;
}

export async function PUT(req: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date: dateStr } = await params;
  if (!isValidDate(dateStr)) {
    return NextResponse.json({ error: "Ungültiges Datum" }, { status: 400 });
  }
  const date = parseIsoDate(dateStr);
  const body = await req.json();

  const schoolSegments: SchoolSegmentInput[] = body.schoolSegments ?? [];
  const homeSegments: HomeSegmentInput[] = body.homeSegments ?? [];
  const breakMinutes = Number(body.breakMinutes ?? 0);
  const blocksOverride = body.blocksOverride === null || body.blocksOverride === undefined
    ? null
    : Number(body.blocksOverride);
  const blocksOverrideReason: string | null = body.blocksOverrideReason || null;
  const noTeachingReason: string | null = body.noTeachingReason || null;
  const scheduleNote: string | null = body.scheduleNote || null;
  const note: string | null = body.note || null;

  const result = await db.$transaction(async (tx) => {
    const entry = await tx.dayEntry.upsert({
      where: { date },
      update: { breakMinutes, blocksOverride, blocksOverrideReason, noTeachingReason, scheduleNote, note },
      create: { date, breakMinutes, blocksOverride, blocksOverrideReason, noTeachingReason, scheduleNote, note },
    });

    await tx.schoolSegment.deleteMany({ where: { dayEntryId: entry.id } });
    await tx.homeSegment.deleteMany({ where: { dayEntryId: entry.id } });

    if (schoolSegments.length > 0) {
      await tx.schoolSegment.createMany({
        data: schoolSegments.map((s) => ({
          dayEntryId: entry.id,
          start: s.start,
          end: s.end,
          isExtra: !!s.isExtra,
          reason: s.reason || null,
        })),
      });
    }
    if (homeSegments.length > 0) {
      await tx.homeSegment.createMany({
        data: homeSegments.map((s) => ({
          dayEntryId: entry.id,
          start: s.start,
          end: s.end,
          categoryId: s.categoryId,
          description: s.description || null,
        })),
      });
    }

    return tx.dayEntry.findUniqueOrThrow({
      where: { id: entry.id },
      include: { schoolSegments: true, homeSegments: { include: { category: true } } },
    });
  });

  return NextResponse.json(result);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date: dateStr } = await params;
  if (!isValidDate(dateStr)) {
    return NextResponse.json({ error: "Ungültiges Datum" }, { status: 400 });
  }
  const date = parseIsoDate(dateStr);
  await db.dayEntry.deleteMany({ where: { date } });
  return NextResponse.json({ deleted: true });
}
