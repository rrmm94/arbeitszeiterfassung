"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { GeneralTab } from "@/components/settings/general-tab";
import { CategoriesTab } from "@/components/settings/categories-tab";
import { HolidaysTab } from "@/components/settings/holidays-tab";
import { RangeListTab } from "@/components/settings/range-list-tab";
import { ImportTab } from "@/components/settings/import-tab";
import { BackupTab } from "@/components/settings/backup-tab";

const TABS = [
  { id: "general", label: "Allgemein" },
  { id: "categories", label: "Kategorien" },
  { id: "holidays", label: "Ferien & Feiertage" },
  { id: "sick", label: "Krankmeldungen" },
  { id: "vacation", label: "Urlaub" },
  { id: "import", label: "Excel-Import" },
  { id: "backup", label: "Backup" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>("general");

  return (
    <div>
      <PageHeader title="Einstellungen" />
      <div className="flex flex-col gap-8 p-4 sm:flex-row sm:p-8">
        <nav className="flex w-44 shrink-0 flex-col gap-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                tab === t.id ? "bg-bg-active font-medium text-text-primary" : "text-text-secondary hover:bg-bg-hover"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="min-w-0 flex-1">
          {tab === "general" && <GeneralTab />}
          {tab === "categories" && <CategoriesTab />}
          {tab === "holidays" && <HolidaysTab />}
          {tab === "sick" && <RangeListTab endpoint="/api/sick-leaves" label="Krankheitszeiten – werden bei der Arbeitszeitberechnung ausgeschlossen." />}
          {tab === "vacation" && <RangeListTab endpoint="/api/vacations" label="Urlaubszeiträume – zählen auf das Urlaubskontingent." />}
          {tab === "import" && <ImportTab />}
          {tab === "backup" && <BackupTab />}
        </div>
      </div>
    </div>
  );
}
