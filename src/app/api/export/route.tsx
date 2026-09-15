import { renderToBuffer } from "@react-pdf/renderer";
import { computeRangeSummary } from "@/lib/aggregate";
import { loadSettings } from "@/lib/data-context";
import { CalendarDocument, SummaryDocument } from "@/lib/pdf/report";
import { schoolYearRange } from "@/lib/school-year";
import { dateOnly, isoDate, parseIsoDate } from "@/lib/time";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") ?? "summary"; // summary | calendar
  const range = searchParams.get("range") ?? "month"; // schoolyear | halfyear | month | custom

  const settings = await loadSettings();
  let start: Date;
  let end: Date;
  let rangeLabel: string;

  if (range === "schoolyear") {
    const startYear = Number(searchParams.get("startYear"));
    const r = schoolYearRange(startYear, settings);
    start = r.start;
    end = r.end;
    rangeLabel = `Schuljahr ${startYear}/${(startYear + 1).toString().slice(-2)}`;
  } else if (range === "halfyear") {
    const startYear = Number(searchParams.get("startYear"));
    const half = searchParams.get("half"); // HY1 | HY2
    const full = schoolYearRange(startYear, settings);
    if (half === "HY1") {
      start = full.start;
      end = dateOnly(startYear + 1, settings.halfYearSwitchMonth, settings.halfYearSwitchDay - 1);
      rangeLabel = `1. Halbjahr ${startYear}/${(startYear + 1).toString().slice(-2)}`;
    } else {
      start = dateOnly(startYear + 1, settings.halfYearSwitchMonth, settings.halfYearSwitchDay);
      end = full.end;
      rangeLabel = `2. Halbjahr ${startYear}/${(startYear + 1).toString().slice(-2)}`;
    }
  } else if (range === "month") {
    const month = searchParams.get("month")!; // YYYY-MM
    const [y, m] = month.split("-").map(Number);
    start = dateOnly(y, m, 1);
    end = dateOnly(y, m + 1, 0);
    rangeLabel = month;
  } else {
    start = parseIsoDate(searchParams.get("start")!);
    end = parseIsoDate(searchParams.get("end")!);
    rangeLabel = `${isoDate(start)} – ${isoDate(end)}`;
  }

  const summary = await computeRangeSummary(start, end);
  const title = kind === "calendar" ? "Kalenderexport" : "Arbeitszeit-Zusammenfassung";

  const doc =
    kind === "calendar" ? (
      <CalendarDocument title={title} rangeLabel={rangeLabel} summary={summary} />
    ) : (
      <SummaryDocument title={title} rangeLabel={rangeLabel} summary={summary} />
    );

  const buffer = await renderToBuffer(doc);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="arbeitszeit-${range}-${rangeLabel.replace(/[^\w-]+/g, "_")}.pdf"`,
    },
  });
}
