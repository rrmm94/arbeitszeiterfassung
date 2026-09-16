"use client";

import { Percent } from "lucide-react";
import { useDisplayMode } from "./display-mode-provider";

export function PercentToggle() {
  const { percentMode, togglePercentMode } = useDisplayMode();

  return (
    <button
      onClick={togglePercentMode}
      title={percentMode ? "Absolute Werte anzeigen" : "Werte in Prozent anzeigen"}
      aria-pressed={percentMode}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
        percentMode
          ? "bg-accent-soft text-accent"
          : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
      }`}
    >
      <Percent size={14} strokeWidth={1.75} />
    </button>
  );
}
