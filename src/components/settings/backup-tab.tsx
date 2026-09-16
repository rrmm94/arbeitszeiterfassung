"use client";

import { useRef, useState } from "react";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";

export function BackupTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ dayEntries: number; workCategories: number; timetableEntries: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    const res = await fetch("/api/backup");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "arbeitszeit-backup.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/backup", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unbekannter Fehler");
      } else {
        setResult(data);
        window.dispatchEvent(new CustomEvent("day-entry-updated"));
      }
    } finally {
      setImporting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h3 className="text-[13px] font-medium text-text-primary">Backup erstellen</h3>
        <p className="text-[12.5px] text-text-secondary">
          Exportiert die komplette Datenbank (Einstellungen, Stundenplan, Kategorien, Feiertage/Ferien,
          Krank-/Urlaubszeiten und alle Tageseinträge) als JSON-Datei. Damit gehen bei einem Umzug oder
          Server-Wechsel keine Daten verloren.
        </p>
        <Button size="sm" onClick={handleExport}>
          <Download size={13} /> Backup herunterladen
        </Button>
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h3 className="text-[13px] font-medium text-text-primary">Backup wiederherstellen</h3>
        <p className="text-[12.5px] text-text-secondary">
          Importiert eine zuvor exportierte Backup-Datei. <strong>Achtung:</strong> Dabei werden{" "}
          <strong>alle aktuellen Daten unwiderruflich ersetzt</strong> – erstelle vorher ggf. selbst ein
          aktuelles Backup.
        </p>

        <input ref={fileRef} type="file" accept=".json" className="text-[12.5px] text-text-secondary" />

        {!confirming ? (
          <Button size="sm" variant="secondary" onClick={() => setConfirming(true)}>
            <Upload size={13} /> Backup importieren
          </Button>
        ) : (
          <div className="flex flex-col gap-2 rounded-md bg-danger-soft p-3">
            <div className="flex items-center gap-2 text-[12.5px] font-medium text-danger">
              <AlertTriangle size={14} />
              Wirklich alle aktuellen Daten ersetzen?
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="danger" onClick={handleImport} disabled={importing}>
                {importing ? "Importiere…" : "Ja, ersetzen"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={importing}>
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-[12.5px] text-danger">{error}</p>}
        {result && (
          <div className="rounded-md bg-bg-hover p-3 text-[12.5px] text-text-secondary">
            Wiederhergestellt: {result.dayEntries} Tageseinträge, {result.workCategories} Kategorien,{" "}
            {result.timetableEntries} Stundenplan-Einträge.
          </div>
        )}
      </section>
    </div>
  );
}
