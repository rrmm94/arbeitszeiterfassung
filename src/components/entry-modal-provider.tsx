"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { EntryModal } from "./entry-modal";

interface EntryModalContextValue {
  openEntryModal: (date?: string) => void;
}

const EntryModalContext = createContext<EntryModalContextValue | null>(null);

export function useEntryModal() {
  const ctx = useContext(EntryModalContext);
  if (!ctx) throw new Error("useEntryModal must be used within EntryModalProvider");
  return ctx;
}

export function EntryModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialDate, setInitialDate] = useState<string | undefined>(undefined);
  const [version, setVersion] = useState(0);

  const openEntryModal = useCallback((date?: string) => {
    setInitialDate(date);
    setVersion((v) => v + 1);
    setOpen(true);
  }, []);

  return (
    <EntryModalContext.Provider value={{ openEntryModal }}>
      {children}
      <EntryModal key={version} open={open} initialDate={initialDate} onClose={() => setOpen(false)} />
    </EntryModalContext.Provider>
  );
}
