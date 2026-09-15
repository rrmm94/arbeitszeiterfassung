"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, inputClass } from "@/components/ui";

interface RangeItem {
  id: number;
  startDate: string;
  endDate: string;
  note: string | null;
}

export function RangeListTab({ endpoint, label }: { endpoint: string; label: string }) {
  const [items, setItems] = useState<RangeItem[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    const res = await fetch(endpoint);
    const data = await res.json();
    setItems(
      data.map((d: { id: number; startDate: string; endDate: string; note: string | null }) => ({
        ...d,
        startDate: d.startDate.slice(0, 10),
        endDate: d.endDate.slice(0, 10),
      }))
    );
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function add() {
    if (!start) return;
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: start, endDate: end || start, note: note || null }),
    });
    setStart("");
    setEnd("");
    setNote("");
    load();
    window.dispatchEvent(new CustomEvent("day-entry-updated"));
  }

  async function remove(id: number) {
    await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    load();
    window.dispatchEvent(new CustomEvent("day-entry-updated"));
  }

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <p className="text-[12.5px] text-text-secondary">{label}</p>

      <div className="flex flex-col gap-2">
        {items.length === 0 && <p className="text-[12.5px] text-text-tertiary">Keine Einträge.</p>}
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-md border border-border p-2.5">
            <span className="text-[12.5px] tabular text-text-primary">
              {item.startDate}
              {item.endDate !== item.startDate ? ` – ${item.endDate}` : ""}
            </span>
            {item.note && <span className="flex-1 text-[12px] text-text-secondary">{item.note}</span>}
            <button onClick={() => remove(item.id)} className="ml-auto text-text-tertiary hover:text-danger">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
        <span className="text-text-tertiary">–</span>
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
        <input
          placeholder="Notiz (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={`${inputClass} flex-1`}
        />
        <Button size="sm" onClick={add}>
          <Plus size={13} />
        </Button>
      </div>
    </div>
  );
}
