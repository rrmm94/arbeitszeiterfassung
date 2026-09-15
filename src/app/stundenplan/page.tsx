"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { inputClass } from "@/components/ui";

type SlotType = "UNTERRICHT" | "BEREITSCHAFT" | "FREI";

interface BlockDefinition {
  number: number;
  label: string;
  startTime: string;
  endTime: string;
}

interface TimetableEntry {
  halfYear: "HY1" | "HY2";
  weekday: number;
  blockNumber: number;
  type: SlotType;
  subject?: string | null;
  room?: string | null;
}

const WEEKDAYS = [
  { n: 1, label: "Montag" },
  { n: 2, label: "Dienstag" },
  { n: 3, label: "Mittwoch" },
  { n: 4, label: "Donnerstag" },
  { n: 5, label: "Freitag" },
];

const TYPE_STYLES: Record<SlotType, string> = {
  UNTERRICHT: "bg-accent-soft border-accent/40 text-text-primary",
  BEREITSCHAFT: "bg-[var(--status-holiday-bg)] border-transparent text-[var(--status-holiday-fg)]",
  FREI: "bg-bg-panel border-border text-text-tertiary",
};

function key(halfYear: string, weekday: number, blockNumber: number) {
  return `${halfYear}-${weekday}-${blockNumber}`;
}

export default function StundenplanPage() {
  const [halfYear, setHalfYear] = useState<"HY1" | "HY2">("HY1");
  const [blocks, setBlocks] = useState<BlockDefinition[]>([]);
  const [entries, setEntries] = useState<Map<string, TimetableEntry>>(new Map());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ type: SlotType; subject: string; room: string }>({
    type: "FREI",
    subject: "",
    room: "",
  });

  const load = useCallback(async () => {
    const [blocksRes, entriesRes] = await Promise.all([
      fetch("/api/block-definitions").then((r) => r.json()),
      fetch(`/api/timetable?halfYear=${halfYear}`).then((r) => r.json()),
    ]);
    setBlocks(blocksRes);
    const map = new Map<string, TimetableEntry>();
    for (const e of entriesRes as TimetableEntry[]) {
      map.set(key(e.halfYear, e.weekday, e.blockNumber), e);
    }
    setEntries(map);
  }, [halfYear]);

  useEffect(() => {
    load();
  }, [load]);

  function openEditor(weekday: number, blockNumber: number) {
    const existing = entries.get(key(halfYear, weekday, blockNumber));
    setDraft({
      type: existing?.type ?? "FREI",
      subject: existing?.subject ?? "",
      room: existing?.room ?? "",
    });
    setEditingKey(key(halfYear, weekday, blockNumber));
  }

  async function saveSlot(weekday: number, blockNumber: number) {
    const slot = {
      halfYear,
      weekday,
      blockNumber,
      type: draft.type,
      subject: draft.subject || null,
      room: draft.room || null,
    };
    await fetch("/api/timetable", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([slot]),
    });
    setEditingKey(null);
    load();
  }

  const blocksSollCount = [...entries.values()].filter((e) => e.type === "UNTERRICHT").length;
  const bereitschaftCount = [...entries.values()].filter((e) => e.type === "BEREITSCHAFT").length;

  return (
    <div>
      <PageHeader
        title="Stundenplan"
        subtitle="Blockzeiten und Zuordnung je Halbjahr"
        actions={
          <div className="flex items-center rounded-md border border-border p-0.5">
            {(["HY1", "HY2"] as const).map((hy) => (
              <button
                key={hy}
                onClick={() => setHalfYear(hy)}
                className={`rounded px-3 py-1 text-[12.5px] font-medium transition-colors ${
                  halfYear === hy ? "bg-bg-active text-text-primary" : "text-text-secondary hover:bg-bg-hover"
                }`}
              >
                {hy === "HY1" ? "1. Halbjahr" : "2. Halbjahr"}
              </button>
            ))}
          </div>
        }
      />

      <div className="p-4 sm:p-8">
        <div className="mb-4 flex gap-4 text-[12.5px] text-text-secondary">
          <span>
            Unterrichtsblöcke verplant: <span className="tabular font-medium text-text-primary">{blocksSollCount}</span>
          </span>
          <span>
            Bereitschaftsblöcke: <span className="tabular font-medium text-text-primary">{bereitschaftCount}</span>
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="w-32 border-b border-border bg-bg-panel p-2 text-left text-[11.5px] font-medium uppercase tracking-wide text-text-tertiary">
                  Block
                </th>
                {WEEKDAYS.map((w) => (
                  <th
                    key={w.n}
                    className="border-b border-l border-border bg-bg-panel p-2 text-left text-[11.5px] font-medium uppercase tracking-wide text-text-tertiary"
                  >
                    {w.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <Fragment key={block.number}>
                  <tr>
                    <td className="border-b border-border p-2 align-top">
                      <div className="text-[12.5px] font-medium text-text-primary">{block.label}</div>
                      <div className="text-[11px] tabular text-text-tertiary">
                        {block.startTime}–{block.endTime}
                      </div>
                    </td>
                    {WEEKDAYS.map((w) => {
                      const k = key(halfYear, w.n, block.number);
                      const entry = entries.get(k);
                      const isEditing = editingKey === k;
                      return (
                        <td key={w.n} className="border-b border-l border-border p-1.5 align-top">
                          {isEditing ? (
                            <div className="flex flex-col gap-1.5 rounded-md border border-border-strong bg-bg-panel p-2 shadow-md">
                              <select
                                value={draft.type}
                                onChange={(e) => setDraft({ ...draft, type: e.target.value as SlotType })}
                                className={`${inputClass} w-full`}
                              >
                                <option value="FREI">Frei</option>
                                <option value="UNTERRICHT">Unterricht</option>
                                <option value="BEREITSCHAFT">Bereitschaft</option>
                              </select>
                              {draft.type === "UNTERRICHT" && (
                                <input
                                  placeholder="Fach/Kurs"
                                  value={draft.subject}
                                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                                  className={`${inputClass} w-full`}
                                />
                              )}
                              <div className="flex gap-1">
                                <button
                                  onClick={() => saveSlot(w.n, block.number)}
                                  className="flex-1 rounded-md bg-accent px-2 py-1 text-[11.5px] font-medium text-accent-fg"
                                >
                                  OK
                                </button>
                                <button
                                  onClick={() => setEditingKey(null)}
                                  className="rounded-md px-2 py-1 text-[11.5px] text-text-secondary hover:bg-bg-hover"
                                >
                                  Abbr.
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => openEditor(w.n, block.number)}
                              className={`flex min-h-[52px] w-full flex-col justify-center rounded-md border px-2 py-1.5 text-left transition-colors hover:opacity-80 ${TYPE_STYLES[entry?.type ?? "FREI"]}`}
                            >
                              {entry?.type === "UNTERRICHT" && (
                                <span className="text-[12.5px] font-medium">{entry.subject || "Unterricht"}</span>
                              )}
                              {entry?.type === "BEREITSCHAFT" && <span className="text-[12.5px] font-medium">Bereitschaft</span>}
                              {(!entry || entry.type === "FREI") && <span className="text-[11.5px]">–</span>}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {block.number === 1 && (
                    <BreakRow label="Pause" from={blocks[0]?.endTime} to={blocks[1]?.startTime} />
                  )}
                  {block.number === 3 && (
                    <BreakRow label="Mittagspause" from={blocks[2]?.endTime} to={blocks[3]?.startTime} />
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BreakRow({ label, from, to }: { label: string; from?: string; to?: string }) {
  return (
    <tr>
      <td colSpan={6} className="border-b border-border bg-bg px-2 py-1 text-[11px] italic text-text-tertiary">
        {label} {from && to ? `(${from}–${to})` : ""}
      </td>
    </tr>
  );
}
