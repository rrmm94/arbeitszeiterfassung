"use client";

import { useEffect, useState } from "react";
import { Archive, Plus, Trash2 } from "lucide-react";
import { Button, inputClass } from "@/components/ui";
import type { WorkCategoryDTO } from "@/lib/api-types";

const PALETTE = ["#3b82f6", "#8b5cf6", "#ef4444", "#f59e0b", "#10b981", "#06b6d4", "#6366f1", "#84cc16", "#ec4899", "#6b7280"];

export function CategoriesTab() {
  const [categories, setCategories] = useState<WorkCategoryDTO[]>([]);
  const [newName, setNewName] = useState("");

  async function load() {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function addCategory() {
    if (!newName.trim()) return;
    const color = PALETTE[categories.length % PALETTE.length];
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color }),
    });
    setNewName("");
    load();
  }

  async function updateColor(id: number, color: string) {
    await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    });
    load();
  }

  async function remove(id: number) {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <p className="text-[12.5px] text-text-secondary">
        Kategorien für außerschulische Arbeitszeit (z.B. Unterrichtsvorbereitung, Fortbildung).
      </p>

      <div className="flex flex-col gap-2">
        {categories.map((c) => (
          <div
            key={c.id}
            className={`flex items-center gap-3 rounded-md border border-border p-2.5 ${c.archived ? "opacity-50" : ""}`}
          >
            <input
              type="color"
              value={c.color}
              onChange={(e) => updateColor(c.id, e.target.value)}
              className="h-6 w-6 cursor-pointer rounded border-none bg-transparent"
            />
            <span className="flex-1 text-[13px] text-text-primary">{c.name}</span>
            {c.archived && <span className="text-[11px] text-text-tertiary">archiviert</span>}
            <button onClick={() => remove(c.id)} className="text-text-tertiary hover:text-danger">
              {c.archived ? <Trash2 size={14} /> : <Archive size={14} />}
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          placeholder="Neue Kategorie…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
          className={`${inputClass} flex-1`}
        />
        <Button size="sm" onClick={addCategory}>
          <Plus size={13} /> Hinzufügen
        </Button>
      </div>
    </div>
  );
}
