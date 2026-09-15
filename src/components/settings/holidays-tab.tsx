"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, inputClass } from "@/components/ui";

interface PublicHoliday {
  id: number;
  date: string;
  name: string;
  source: "api" | "manual";
}
interface SchoolVacation {
  id: number;
  startDate: string;
  endDate: string;
  name: string;
  source: "api" | "manual";
}

export function HolidaysTab() {
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [schoolVacations, setSchoolVacations] = useState<SchoolVacation[]>([]);
  const [newHoliday, setNewHoliday] = useState({ date: "", name: "" });
  const [newVacation, setNewVacation] = useState({ startDate: "", endDate: "", name: "" });

  async function load() {
    const res = await fetch("/api/holidays");
    const data = await res.json();
    setPublicHolidays(data.publicHolidays.map((h: PublicHoliday) => ({ ...h, date: h.date.slice(0, 10) })));
    setSchoolVacations(
      data.schoolVacations.map((v: SchoolVacation) => ({
        ...v,
        startDate: v.startDate.slice(0, 10),
        endDate: v.endDate.slice(0, 10),
      }))
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function addHoliday() {
    if (!newHoliday.date || !newHoliday.name) return;
    await fetch("/api/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "public", ...newHoliday }),
    });
    setNewHoliday({ date: "", name: "" });
    load();
    window.dispatchEvent(new CustomEvent("day-entry-updated"));
  }

  async function addVacation() {
    if (!newVacation.startDate || !newVacation.name) return;
    await fetch("/api/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "school", ...newVacation, endDate: newVacation.endDate || newVacation.startDate }),
    });
    setNewVacation({ startDate: "", endDate: "", name: "" });
    load();
    window.dispatchEvent(new CustomEvent("day-entry-updated"));
  }

  async function removeHoliday(id: number) {
    await fetch(`/api/holidays/public/${id}`, { method: "DELETE" });
    load();
    window.dispatchEvent(new CustomEvent("day-entry-updated"));
  }
  async function removeVacation(id: number) {
    await fetch(`/api/holidays/school/${id}`, { method: "DELETE" });
    load();
    window.dispatchEvent(new CustomEvent("day-entry-updated"));
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h3 className="text-[13px] font-medium text-text-primary">Feiertage</h3>
        <div className="flex flex-col gap-1.5">
          {publicHolidays.map((h) => (
            <div key={h.id} className="flex items-center gap-3 rounded-md border border-border px-2.5 py-1.5">
              <span className="w-24 text-[12.5px] tabular text-text-primary">{h.date}</span>
              <span className="flex-1 text-[12.5px] text-text-secondary">{h.name}</span>
              <span className="text-[10.5px] uppercase text-text-tertiary">{h.source === "manual" ? "manuell" : "API"}</span>
              <button onClick={() => removeHoliday(h.id)} className="text-text-tertiary hover:text-danger">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={newHoliday.date}
            onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Bezeichnung"
            value={newHoliday.name}
            onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
            className={`${inputClass} flex-1`}
          />
          <Button size="sm" onClick={addHoliday}><Plus size={13} /></Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-[13px] font-medium text-text-primary">Schulferien</h3>
        <div className="flex flex-col gap-1.5">
          {schoolVacations.map((v) => (
            <div key={v.id} className="flex items-center gap-3 rounded-md border border-border px-2.5 py-1.5">
              <span className="w-44 text-[12.5px] tabular text-text-primary">{v.startDate} – {v.endDate}</span>
              <span className="flex-1 text-[12.5px] text-text-secondary">{v.name}</span>
              <span className="text-[10.5px] uppercase text-text-tertiary">{v.source === "manual" ? "manuell" : "API"}</span>
              <button onClick={() => removeVacation(v.id)} className="text-text-tertiary hover:text-danger">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={newVacation.startDate}
            onChange={(e) => setNewVacation({ ...newVacation, startDate: e.target.value })}
            className={inputClass}
          />
          <span className="text-text-tertiary">–</span>
          <input
            type="date"
            value={newVacation.endDate}
            onChange={(e) => setNewVacation({ ...newVacation, endDate: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Bezeichnung"
            value={newVacation.name}
            onChange={(e) => setNewVacation({ ...newVacation, name: e.target.value })}
            className={`${inputClass} flex-1`}
          />
          <Button size="sm" onClick={addVacation}><Plus size={13} /></Button>
        </div>
      </section>
    </div>
  );
}
