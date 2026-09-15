import { computeRangeSummary } from "@/lib/aggregate";
import { dateOnly, isoDate } from "@/lib/time";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "YYYY-MM"
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Ungültiger Monat" }, { status: 400 });
  }
  const [y, m] = month.split("-").map(Number);
  const start = dateOnly(y, m, 1);
  const end = dateOnly(y, m + 1, 0);

  const summary = await computeRangeSummary(start, end);

  return NextResponse.json({
    days: summary.days.map((d) => ({ ...d, date: isoDate(d.date) })),
    totals: summary.totals,
  });
}
