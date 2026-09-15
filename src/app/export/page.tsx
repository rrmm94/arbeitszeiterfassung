"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button, Field, inputClass } from "@/components/ui";
import { FileDown } from "lucide-react";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ExportPage() {
  const now = new Date();
  const currentSchoolYear = now.getMonth() + 1 >= 8 ? now.getFullYear() : now.getFullYear() - 1;

  const [kind, setKind] = useState<"summary" | "calendar">("summary");
  const [range, setRange] = useState<"schoolyear" | "halfyear" | "month" | "custom">("month");
  const [startYear, setStartYear] = useState(currentSchoolYear);
  const [half, setHalf] = useState<"HY1" | "HY2">("HY1");
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [customStart, setCustomStart] = useState(todayIso());
  const [customEnd, setCustomEnd] = useState(todayIso());
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    const params = new URLSearchParams({ kind, range });
    if (range === "schoolyear") params.set("startYear", String(startYear));
    if (range === "halfyear") { params.set("startYear", String(startYear)); params.set("half", half); }
    if (range === "month") params.set("month", month);
    if (range === "custom") { params.set("start", customStart); params.set("end", customEnd); }

    try {
      const res = await fetch(`/api/export?${params.toString()}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "arbeitszeit-export.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Export" subtitle="PDF-Bericht für Schuljahr, Halbjahr, Monat oder Zeitraum" />

      <div className="flex max-w-lg flex-col gap-6 p-4 sm:p-8">
        <section className="flex flex-col gap-2">
          <h3 className="text-[12.5px] font-medium text-text-primary">Art des Berichts</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setKind("summary")}
              className={`flex-1 rounded-md border px-3 py-2 text-left text-[12.5px] ${kind === "summary" ? "border-accent bg-accent-soft text-text-primary" : "border-border text-text-secondary hover:bg-bg-hover"}`}
            >
              <div className="font-medium">Zusammenfassung</div>
              <div className="text-[11.5px] text-text-tertiary">Kennzahlen & Kategorien</div>
            </button>
            <button
              onClick={() => setKind("calendar")}
              className={`flex-1 rounded-md border px-3 py-2 text-left text-[12.5px] ${kind === "calendar" ? "border-accent bg-accent-soft text-text-primary" : "border-border text-text-secondary hover:bg-bg-hover"}`}
            >
              <div className="font-medium">Vollständiger Kalender</div>
              <div className="text-[11.5px] text-text-tertiary">Tag-für-Tag-Auflistung</div>
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-[12.5px] font-medium text-text-primary">Zeitraum</h3>
          <select value={range} onChange={(e) => setRange(e.target.value as typeof range)} className={inputClass}>
            <option value="schoolyear">Gesamtes Schuljahr</option>
            <option value="halfyear">Halbjahr</option>
            <option value="month">Monat</option>
            <option value="custom">Benutzerdefiniert</option>
          </select>

          {(range === "schoolyear" || range === "halfyear") && (
            <Field label="Schuljahr (Startjahr)">
              <input
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className={`${inputClass} w-32`}
              />
            </Field>
          )}
          {range === "halfyear" && (
            <Field label="Halbjahr">
              <select value={half} onChange={(e) => setHalf(e.target.value as "HY1" | "HY2")} className={`${inputClass} w-40`}>
                <option value="HY1">1. Halbjahr</option>
                <option value="HY2">2. Halbjahr</option>
              </select>
            </Field>
          )}
          {range === "month" && (
            <Field label="Monat">
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputClass} w-40`} />
            </Field>
          )}
          {range === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className={inputClass} />
              <span className="text-text-tertiary">–</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className={inputClass} />
            </div>
          )}
        </section>

        <Button onClick={handleExport} disabled={loading}>
          <FileDown size={14} /> {loading ? "Erstelle PDF…" : "PDF herunterladen"}
        </Button>
      </div>
    </div>
  );
}
