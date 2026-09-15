"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-full">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-60 shrink-0 bg-bg">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
          <button
            aria-label="Menü schließen"
            onClick={() => setOpen(false)}
            className="flex-1 bg-black/30 backdrop-blur-[1px]"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 md:hidden">
          <button onClick={() => setOpen(true)} className="text-text-secondary">
            <Menu size={18} />
          </button>
          <span className="text-[13px] font-medium text-text-primary">Arbeitszeit</span>
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
