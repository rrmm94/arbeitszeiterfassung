"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui";

interface ImportResult {
  entriesCreated: number;
  entriesSkipped: number;
  sickRangesCreated: number;
  vacationRangesCreated: number;
}

export function ImportTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import/excel", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unbekannter Fehler");
      } else {
        setResult(data);
        window.dispatchEvent(new CustomEvent("day-entry-updated"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <p className="text-[12.5px] text-text-secondary">
        Importiert Tageseinträge aus der bisherigen Excel-Arbeitszeiterfassung: Spalten D/E (Schule) werden
        als Schulzeit übernommen, die Spalten F/G und H/I (&bdquo;Zusatz 1&ldquo;/&bdquo;Zusatz 2&ldquo;) als
        außerschulische Arbeit unter der Kategorie &bdquo;Zusatzarbeit (Import)&ldquo; – diese Einträge kannst
        du danach in der Kalenderansicht noch einer passenderen Kategorie zuordnen. Pause (J), Blockanzahl (M)
        und Ereignis-Notizen (P) werden ebenfalls übernommen, ebenso Kranktage/Urlaub (Spalte N). Feiertage und
        Ferien werden nicht importiert, da diese automatisch geladen werden. Bereits vorhandene Tageseinträge
        werden nicht überschrieben.
      </p>

      <input ref={fileRef} type="file" accept=".xlsx" className="text-[12.5px] text-text-secondary" />

      <Button onClick={handleImport} disabled={loading}>
        <Upload size={13} /> {loading ? "Importiere…" : "Excel-Datei importieren"}
      </Button>

      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      {result && (
        <div className="rounded-md bg-bg-hover p-3 text-[12.5px] text-text-secondary">
          <p>{result.entriesCreated} Tageseinträge importiert ({result.entriesSkipped} bereits vorhanden, übersprungen).</p>
          <p>{result.sickRangesCreated} Krankheitszeiträume, {result.vacationRangesCreated} Urlaubszeiträume angelegt.</p>
        </div>
      )}
    </div>
  );
}
