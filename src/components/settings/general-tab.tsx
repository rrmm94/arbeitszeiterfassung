"use client";

import { useEffect, useState } from "react";
import { Button, Field, inputClass } from "@/components/ui";

interface Settings {
  fullTimeUE: number;
  fullTimeBlocks: number;
  employmentFactor: number;
  compareWeeklyHours: number;
  compareVacationDays: number;
  vacationDaysPerYear: number;
  schoolYearStartMonth: number;
  halfYearSwitchMonth: number;
  halfYearSwitchDay: number;
  federalState: string;
}

const STATES = [
  ["DE-BW", "Baden-Württemberg"], ["DE-BY", "Bayern"], ["DE-BE", "Berlin"], ["DE-BB", "Brandenburg"],
  ["DE-HB", "Bremen"], ["DE-HH", "Hamburg"], ["DE-HE", "Hessen"], ["DE-MV", "Mecklenburg-Vorpommern"],
  ["DE-NI", "Niedersachsen"], ["DE-NW", "Nordrhein-Westfalen"], ["DE-RP", "Rheinland-Pfalz"],
  ["DE-SL", "Saarland"], ["DE-SN", "Sachsen"], ["DE-ST", "Sachsen-Anhalt"], ["DE-SH", "Schleswig-Holstein"],
  ["DE-TH", "Thüringen"],
];

export function GeneralTab() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setSettings);
  }, []);

  if (!settings) return <p className="text-[13px] text-text-tertiary">Lädt…</p>;

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
    setSaved(false);
  }

  async function save() {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved(true);
  }

  async function refreshHolidays() {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const res = await fetch("/api/holidays/refresh", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setRefreshMsg(`Fehler: ${data.error}`);
      } else {
        setRefreshMsg(`${data.publicCount} Feiertage, ${data.vacationCount} Ferienzeiträume geladen.`);
      }
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-[13px] font-medium text-text-primary">Unterrichtsverpflichtung</h3>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Soll-UE (45 Min)">
            <input
              type="number"
              step="0.1"
              value={settings.fullTimeUE}
              onChange={(e) => update("fullTimeUE", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Soll-Blöcke (75 Min)">
            <input
              type="number"
              step="0.1"
              value={settings.fullTimeBlocks}
              onChange={(e) => update("fullTimeBlocks", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Beschäftigungsfaktor" hint="1.0 = Vollzeit">
            <input
              type="number"
              step="0.05"
              value={settings.employmentFactor}
              onChange={(e) => update("employmentFactor", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-[13px] font-medium text-text-primary">Vergleichswerte (klassische Vollzeitstelle)</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Wochenstunden" hint="Basis für Soll-Arbeitszeit">
            <input
              type="number"
              step="0.5"
              value={settings.compareWeeklyHours}
              onChange={(e) => update("compareWeeklyHours", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Urlaubstage/Jahr (Vergleich)">
            <input
              type="number"
              step="1"
              value={settings.compareVacationDays}
              onChange={(e) => update("compareVacationDays", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Eigene Urlaubstage/Jahr">
          <input
            type="number"
            step="1"
            value={settings.vacationDaysPerYear}
            onChange={(e) => update("vacationDaysPerYear", Number(e.target.value))}
            className={`${inputClass} w-32`}
          />
        </Field>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-[13px] font-medium text-text-primary">Schuljahr</h3>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Start Schuljahr (Monat)">
            <input
              type="number"
              min={1}
              max={12}
              value={settings.schoolYearStartMonth}
              onChange={(e) => update("schoolYearStartMonth", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Wechsel 2. Halbjahr (Monat)">
            <input
              type="number"
              min={1}
              max={12}
              value={settings.halfYearSwitchMonth}
              onChange={(e) => update("halfYearSwitchMonth", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Wechsel (Tag)">
            <input
              type="number"
              min={1}
              max={31}
              value={settings.halfYearSwitchDay}
              onChange={(e) => update("halfYearSwitchDay", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-[13px] font-medium text-text-primary">Region (Feiertage &amp; Ferien)</h3>
        <Field label="Bundesland">
          <select
            value={settings.federalState}
            onChange={(e) => update("federalState", e.target.value)}
            className={`${inputClass} w-64`}
          >
            {STATES.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </Field>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={refreshHolidays} disabled={refreshing}>
            {refreshing ? "Lädt…" : "Feiertage & Ferien neu laden"}
          </Button>
          {refreshMsg && <span className="text-[12px] text-text-secondary">{refreshMsg}</span>}
        </div>
      </section>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button onClick={save}>Speichern</Button>
        {saved && <span className="text-[12px] text-accent">Gespeichert.</span>}
      </div>
    </div>
  );
}
