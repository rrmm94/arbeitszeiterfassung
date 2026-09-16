"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, RotateCcw, ThermometerSun, Plane, GraduationCap } from "lucide-react";
import { Button, Field, inputClass, Modal, ModalHeader, StatusBadge, TimeInput } from "./ui";
import type { DayResponseDTO, HomeSegmentDTO, SchoolSegmentDTO, WorkCategoryDTO } from "@/lib/api-types";
import { formatHours } from "@/lib/time";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function emitUpdated() {
  window.dispatchEvent(new CustomEvent("day-entry-updated"));
}

export function EntryModal({
  open,
  initialDate,
  onClose,
}: {
  open: boolean;
  initialDate?: string;
  onClose: () => void;
}) {
  const [date, setDate] = useState(initialDate ?? todayIso());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<DayResponseDTO | null>(null);
  const [categories, setCategories] = useState<WorkCategoryDTO[]>([]);

  const [schoolSegments, setSchoolSegments] = useState<SchoolSegmentDTO[]>([]);
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [blocksOverride, setBlocksOverride] = useState<number>(0);
  const [blocksOverrideReason, setBlocksOverrideReason] = useState("");
  const [noTeachingReason, setNoTeachingReason] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");
  const [homeSegments, setHomeSegments] = useState<HomeSegmentDTO[]>([]);
  const [note, setNote] = useState("");

  const [showSick, setShowSick] = useState(false);
  const [showVacation, setShowVacation] = useState(false);
  const [showNoTeaching, setShowNoTeaching] = useState(false);
  const [noTeachingRangeReason, setNoTeachingRangeReason] = useState("Fortbildung");
  const [rangeEnd, setRangeEnd] = useState(date);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const [dayRes, catRes] = await Promise.all([
        fetch(`/api/day/${d}`).then((r) => r.json()),
        categories.length ? Promise.resolve(categories) : fetch("/api/categories").then((r) => r.json()),
      ]);
      const dayData: DayResponseDTO = dayRes;
      setData(dayData);
      if (catRes !== categories) setCategories(catRes.filter((c: WorkCategoryDTO) => !c.archived));

      if (dayData.entry) {
        setSchoolSegments(dayData.entry.schoolSegments.map((s) => ({ ...s })));
        setBreakMinutes(dayData.entry.breakMinutes);
        setBlocksOverride(dayData.entry.blocksOverride ?? dayData.suggested?.blocksSoll ?? 0);
        setBlocksOverrideReason(dayData.entry.blocksOverrideReason ?? "");
        setNoTeachingReason(dayData.entry.noTeachingReason ?? "");
        setScheduleNote(dayData.entry.scheduleNote ?? "");
        setHomeSegments(dayData.entry.homeSegments.map((s) => ({ ...s })));
        setNote(dayData.entry.note ?? "");
      } else if (dayData.suggested) {
        setSchoolSegments(dayData.suggested.segments.map((s) => ({ ...s, isExtra: false, reason: null })));
        setBreakMinutes(dayData.suggested.breakMinutes);
        setBlocksOverride(dayData.suggested.blocksSoll);
        setBlocksOverrideReason("");
        setNoTeachingReason("");
        setScheduleNote("");
        setHomeSegments([]);
        setNote("");
      } else {
        setSchoolSegments([]);
        setBreakMinutes(0);
        setBlocksOverride(0);
        setBlocksOverrideReason("");
        setNoTeachingReason("");
        setScheduleNote("");
        setHomeSegments([]);
        setNote("");
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setRangeEnd(date);
  }, [date]);

  function onDateChange(newDate: string) {
    setDate(newDate);
    load(newDate);
  }

  const status = data?.computed.status ?? "WERKTAG";
  const isKrank = status === "KRANK";
  const isUrlaub = status === "URLAUB";
  const hasNoTeaching = !!noTeachingReason.trim();
  const schoolDisabled = isKrank || isUrlaub || hasNoTeaching;

  const liveNettoMinutes = useMemo(() => {
    const schoolMin = schoolSegments.reduce((sum, s) => {
      const [sh, sm] = s.start.split(":").map(Number);
      const [eh, em] = s.end.split(":").map(Number);
      const d = eh * 60 + em - (sh * 60 + sm);
      return sum + (d > 0 ? d : 0);
    }, 0);
    const homeMin = homeSegments.reduce((sum, s) => {
      const [sh, sm] = s.start.split(":").map(Number);
      const [eh, em] = s.end.split(":").map(Number);
      const d = eh * 60 + em - (sh * 60 + sm);
      return sum + (d > 0 ? d : 0);
    }, 0);
    return Math.max(0, schoolMin - breakMinutes) + homeMin;
  }, [schoolSegments, homeSegments, breakMinutes]);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/day/${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolSegments: schoolDisabled ? [] : schoolSegments,
          breakMinutes: schoolDisabled ? 0 : breakMinutes,
          blocksOverride: schoolDisabled ? null : blocksOverride,
          blocksOverrideReason: blocksOverrideReason || null,
          noTeachingReason: hasNoTeaching ? noTeachingReason.trim() : null,
          scheduleNote: scheduleNote || null,
          homeSegments,
          note: note || null,
        }),
      });
      emitUpdated();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await fetch(`/api/day/${date}`, { method: "DELETE" });
      emitUpdated();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function submitSick() {
    await fetch("/api/sick-leaves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: date, endDate: rangeEnd }),
    });
    emitUpdated();
    setShowSick(false);
    load(date);
  }

  async function submitVacation() {
    await fetch("/api/vacations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: date, endDate: rangeEnd }),
    });
    emitUpdated();
    setShowVacation(false);
    load(date);
  }

  async function submitNoTeachingRange() {
    await fetch("/api/day/no-teaching", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: date, endDate: rangeEnd, reason: noTeachingRangeReason }),
    });
    emitUpdated();
    setShowNoTeaching(false);
    load(date);
  }

  function resetToTimetable() {
    if (!data?.suggested) return;
    setSchoolSegments(data.suggested.segments.map((s) => ({ ...s, isExtra: false, reason: null })));
    setBreakMinutes(data.suggested.breakMinutes);
    setBlocksOverride(data.suggested.blocksSoll);
    setBlocksOverrideReason("");
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader onClose={onClose}>Tageseintrag</ModalHeader>

      <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
        <div className="mb-4 flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className={inputClass}
          />
          {data && <StatusBadge status={status} label={data.computed.statusLabel} />}
          {data && (
            <span className="ml-auto text-[12px] text-text-secondary">
              KW {data.computed.weekNumber}
            </span>
          )}
        </div>

        {loading && <div className="py-8 text-center text-[13px] text-text-tertiary">Lädt…</div>}

        {!loading && data && (
          <div className="flex flex-col gap-5">
            {(isKrank || isUrlaub) && (
              <div className="rounded-md bg-bg-hover px-3 py-2 text-[12.5px] text-text-secondary">
                {isKrank
                  ? "Krankheitstag – Schulzeit wird nicht erfasst."
                  : "Urlaubstag – Schulzeit wird nicht erfasst, außerschulische Arbeit ist weiterhin möglich."}
              </div>
            )}

            {!isKrank && !isUrlaub && (
              <div className="flex flex-col gap-1.5 rounded-md border border-border p-2.5">
                <label className="flex items-center gap-2 text-[12.5px] text-text-primary">
                  <input
                    type="checkbox"
                    checked={hasNoTeaching}
                    onChange={(e) => setNoTeachingReason(e.target.checked ? noTeachingReason || "Fortbildung" : "")}
                  />
                  Kein Unterricht an diesem Tag (z.B. Fortbildung, Exkursion, dienstliche Abwesenheit)
                </label>
                {hasNoTeaching && (
                  <>
                    <input
                      placeholder="Grund (z.B. Fortbildung Mathe Startchancen)…"
                      value={noTeachingReason}
                      onChange={(e) => setNoTeachingReason(e.target.value)}
                      className={`${inputClass} w-full`}
                    />
                    <p className="text-[11.5px] text-text-tertiary">
                      Unterrichtsblöcke-Soll entfällt für diesen Tag, die allgemeine Arbeitszeit-Soll bleibt
                      bestehen. Zeit für die Veranstaltung kannst du unten als außerschulische Arbeit erfassen.
                    </p>
                  </>
                )}
              </div>
            )}

            {!schoolDisabled && (
              <section className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[12.5px] font-medium text-text-primary">Schule</h3>
                  {data.suggested && (
                    <button
                      onClick={resetToTimetable}
                      className="flex items-center gap-1 text-[11.5px] text-text-tertiary hover:text-accent"
                    >
                      <RotateCcw size={11} /> Stundenplan übernehmen
                    </button>
                  )}
                </div>

                {schoolSegments.map((seg, i) => (
                  <div key={i} className="flex flex-col gap-1.5 rounded-md border border-border p-2.5">
                    <div className="flex items-center gap-2">
                      <TimeInput value={seg.start} onChange={(v) => {
                        const next = [...schoolSegments];
                        next[i] = { ...next[i], start: v };
                        setSchoolSegments(next);
                      }} />
                      <span className="text-text-tertiary">–</span>
                      <TimeInput value={seg.end} onChange={(v) => {
                        const next = [...schoolSegments];
                        next[i] = { ...next[i], end: v };
                        setSchoolSegments(next);
                      }} />
                      <label className="ml-2 flex items-center gap-1.5 text-[12px] text-text-secondary">
                        <input
                          type="checkbox"
                          checked={seg.isExtra}
                          onChange={(e) => {
                            const next = [...schoolSegments];
                            next[i] = { ...next[i], isExtra: e.target.checked };
                            setSchoolSegments(next);
                          }}
                        />
                        Zusatzstunde
                      </label>
                      <button
                        onClick={() => setSchoolSegments(schoolSegments.filter((_, idx) => idx !== i))}
                        className="ml-auto text-text-tertiary hover:text-danger"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {seg.isExtra && (
                      <input
                        placeholder="Begründung für Zusatzstunde…"
                        value={seg.reason ?? ""}
                        onChange={(e) => {
                          const next = [...schoolSegments];
                          next[i] = { ...next[i], reason: e.target.value };
                          setSchoolSegments(next);
                        }}
                        className={`${inputClass} w-full`}
                      />
                    )}
                  </div>
                ))}

                <button
                  onClick={() =>
                    setSchoolSegments([...schoolSegments, { start: "08:00", end: "09:00", isExtra: false, reason: "" }])
                  }
                  className="flex items-center gap-1.5 self-start text-[12px] text-text-secondary hover:text-accent"
                >
                  <Plus size={13} /> Zeitraum hinzufügen
                </button>

                <div className="flex items-center gap-3">
                  <Field label="Pause (Minuten)">
                    <input
                      type="number"
                      min={0}
                      value={breakMinutes}
                      onChange={(e) => setBreakMinutes(Number(e.target.value))}
                      className={`${inputClass} w-24`}
                    />
                  </Field>
                  <Field
                    label="Unterrichtsblöcke"
                    hint={
                      data.suggested
                        ? `Soll: ${data.suggested.blocksSoll}${data.suggested.bereitschaftBlocks ? ` · Bereitschaft: ${data.suggested.bereitschaftBlocks}` : ""}`
                        : undefined
                    }
                  >
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={blocksOverride}
                      onChange={(e) => setBlocksOverride(Number(e.target.value))}
                      className={`${inputClass} w-24`}
                    />
                  </Field>
                </div>
                {data.suggested && blocksOverride !== data.suggested.blocksSoll && (
                  <input
                    placeholder="Begründung für abweichende Blockanzahl (z.B. Vertretung)…"
                    value={blocksOverrideReason}
                    onChange={(e) => setBlocksOverrideReason(e.target.value)}
                    className={`${inputClass} w-full`}
                  />
                )}
                <input
                  placeholder="Anmerkung bei Abweichung vom Stundenplan…"
                  value={scheduleNote}
                  onChange={(e) => setScheduleNote(e.target.value)}
                  className={`${inputClass} w-full`}
                />
              </section>
            )}

            <section className="flex flex-col gap-2.5">
              <h3 className="text-[12.5px] font-medium text-text-primary">Außerschulische Arbeit</h3>
              {homeSegments.map((seg, i) => (
                <div key={i} className="flex flex-col gap-1.5 rounded-md border border-border p-2.5">
                  <div className="flex items-center gap-2">
                    <TimeInput value={seg.start} onChange={(v) => {
                      const next = [...homeSegments];
                      next[i] = { ...next[i], start: v };
                      setHomeSegments(next);
                    }} />
                    <span className="text-text-tertiary">–</span>
                    <TimeInput value={seg.end} onChange={(v) => {
                      const next = [...homeSegments];
                      next[i] = { ...next[i], end: v };
                      setHomeSegments(next);
                    }} />
                    <select
                      value={seg.categoryId}
                      onChange={(e) => {
                        const next = [...homeSegments];
                        next[i] = { ...next[i], categoryId: Number(e.target.value) };
                        setHomeSegments(next);
                      }}
                      className={`${inputClass} flex-1`}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setHomeSegments(homeSegments.filter((_, idx) => idx !== i))}
                      className="text-text-tertiary hover:text-danger"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <input
                    placeholder="Beschreibung (optional)…"
                    value={seg.description ?? ""}
                    onChange={(e) => {
                      const next = [...homeSegments];
                      next[i] = { ...next[i], description: e.target.value };
                      setHomeSegments(next);
                    }}
                    className={`${inputClass} w-full`}
                  />
                </div>
              ))}
              <button
                onClick={() =>
                  setHomeSegments([
                    ...homeSegments,
                    { start: "15:00", end: "16:00", categoryId: categories[0]?.id ?? 0, description: "" },
                  ])
                }
                disabled={categories.length === 0}
                className="flex items-center gap-1.5 self-start text-[12px] text-text-secondary hover:text-accent"
              >
                <Plus size={13} /> Eintrag hinzufügen
              </button>
            </section>

            <section className="flex flex-col gap-1.5">
              <h3 className="text-[12.5px] font-medium text-text-primary">Notiz</h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Allgemeine Anmerkung zum Tag…"
                className={`${inputClass} w-full resize-none`}
              />
            </section>

            <section className="flex flex-col gap-2 border-t border-border pt-3.5">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSick((v) => !v)}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] text-text-secondary hover:bg-bg-hover"
                >
                  <ThermometerSun size={13} /> Krank melden
                </button>
                <button
                  onClick={() => setShowVacation((v) => !v)}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] text-text-secondary hover:bg-bg-hover"
                >
                  <Plane size={13} /> Urlaub eintragen
                </button>
                <button
                  onClick={() => setShowNoTeaching((v) => !v)}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] text-text-secondary hover:bg-bg-hover"
                >
                  <GraduationCap size={13} /> Fortbildung (Zeitraum)
                </button>
              </div>
              {showSick && (
                <div className="flex items-center gap-2 rounded-md bg-bg-hover p-2.5">
                  <span className="text-[12px] text-text-secondary">von {date} bis</span>
                  <input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className={inputClass} />
                  <Button size="sm" onClick={submitSick}>Speichern</Button>
                </div>
              )}
              {showVacation && (
                <div className="flex items-center gap-2 rounded-md bg-bg-hover p-2.5">
                  <span className="text-[12px] text-text-secondary">von {date} bis</span>
                  <input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className={inputClass} />
                  <Button size="sm" onClick={submitVacation}>Speichern</Button>
                </div>
              )}
              {showNoTeaching && (
                <div className="flex flex-wrap items-center gap-2 rounded-md bg-bg-hover p-2.5">
                  <span className="text-[12px] text-text-secondary">von {date} bis</span>
                  <input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className={inputClass} />
                  <input
                    placeholder="Grund (z.B. Fortbildung Mathe Startchancen)…"
                    value={noTeachingRangeReason}
                    onChange={(e) => setNoTeachingRangeReason(e.target.value)}
                    className={`${inputClass} min-w-[200px] flex-1`}
                  />
                  <Button size="sm" onClick={submitNoTeachingRange}>Speichern</Button>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {!loading && data && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <div className="text-[12.5px] text-text-secondary">
            Netto heute: <span className="font-medium text-text-primary tabular">{formatHours(liveNettoMinutes / 60)}</span>
            {data.computed.status === "WERKTAG" && (
              <span className="ml-2">
                Soll: <span className="tabular">{formatHours(data.computed.sollHours)}</span>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {data.entry && (
              <Button variant="danger" onClick={handleDelete} disabled={saving}>
                Löschen
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={saving}>Speichern</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
