"use client";

import { CalendarDays, CalendarRange, FileDown, LayoutDashboard, Plus, Settings, Timer } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { PercentToggle } from "./percent-toggle";
import { useEntryModal } from "./entry-modal-provider";

function currentSchoolYearLabel(startMonth: number): string {
  const now = new Date();
  const y = now.getMonth() + 1 >= startMonth ? now.getFullYear() : now.getFullYear() - 1;
  return `Schuljahr ${y}/${(y + 1).toString().slice(-2)}`;
}

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kalender", label: "Kalender", icon: CalendarDays },
  { href: "/jahresansicht", label: "Jahresansicht", icon: CalendarRange },
  { href: "/stundenplan", label: "Stundenplan", icon: Timer },
  { href: "/export", label: "Export", icon: FileDown },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { openEntryModal } = useEntryModal();
  const [yearLabel, setYearLabel] = useState(currentSchoolYearLabel(8));

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => setYearLabel(currentSchoolYearLabel(s.schoolYearStartMonth)))
      .catch(() => {});
  }, []);

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-bg px-3 py-4">
      <div className="mb-5 flex items-center justify-between px-2">
        <span className="text-[13px] font-medium text-text-primary">Arbeitszeit</span>
        <div className="flex items-center gap-0.5">
          <PercentToggle />
          <ThemeToggle />
        </div>
      </div>

      <button
        onClick={() => {
          openEntryModal();
          onNavigate?.();
        }}
        className="mb-5 flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-[13px] font-medium text-accent-fg shadow-sm transition-colors hover:bg-accent-hover"
      >
        <Plus size={15} strokeWidth={2} />
        Neuer Eintrag
      </button>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                active
                  ? "bg-bg-active text-text-primary font-medium"
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              }`}
            >
              <Icon size={15} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pt-4 text-[11px] text-text-tertiary">{yearLabel}</div>
    </aside>
  );
}
