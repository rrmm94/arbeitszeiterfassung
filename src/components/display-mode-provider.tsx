"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface DisplayModeContextValue {
  percentMode: boolean;
  togglePercentMode: () => void;
}

const DisplayModeContext = createContext<DisplayModeContextValue | null>(null);

export function useDisplayMode() {
  const ctx = useContext(DisplayModeContext);
  if (!ctx) throw new Error("useDisplayMode must be used within DisplayModeProvider");
  return ctx;
}

export function DisplayModeProvider({ children }: { children: React.ReactNode }) {
  const [percentMode, setPercentMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("percentMode");
    if (stored === "true") setPercentMode(true);
  }, []);

  function togglePercentMode() {
    setPercentMode((v) => {
      const next = !v;
      localStorage.setItem("percentMode", String(next));
      return next;
    });
  }

  return (
    <DisplayModeContext.Provider value={{ percentMode, togglePercentMode }}>{children}</DisplayModeContext.Provider>
  );
}

// Formatiert einen Ist/Soll-Wert je nach Anzeigemodus entweder absolut ("Ist / Soll")
// oder als Prozentsatz (Ist/Soll * 100%).
export function formatIstSoll(
  ist: number,
  soll: number,
  percentMode: boolean,
  formatAbsolute: (v: number) => string
): string {
  if (percentMode) {
    if (soll === 0) return ist === 0 ? "0%" : "–";
    return `${Math.round((ist / soll) * 100)}%`;
  }
  return `${formatAbsolute(ist)} / ${formatAbsolute(soll)}`;
}
