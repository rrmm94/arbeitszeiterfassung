"use client";

import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import type { DayStatus } from "@/lib/api-types";

export function Modal({
  open,
  onClose,
  children,
  width = 640,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 pt-[8vh] backdrop-blur-[2px]">
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: width }}
        className="w-full rounded-xl border border-border bg-bg-panel shadow-md"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function ModalHeader({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
      <div className="text-[14px] font-medium text-text-primary">{children}</div>
      <button
        onClick={onClose}
        className="flex h-6 w-6 items-center justify-center rounded-md text-text-tertiary hover:bg-bg-hover hover:text-text-primary"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none";
  const sizes = size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3.5 py-1.5 text-[13px]";
  const variants: Record<string, string> = {
    primary: "bg-accent text-accent-fg hover:bg-accent-hover",
    secondary: "bg-bg-hover text-text-primary hover:bg-bg-active border border-border",
    ghost: "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
    danger: "bg-danger-soft text-danger hover:brightness-95",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes} ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11.5px] font-medium uppercase tracking-wide text-text-tertiary">{label}</span>
      {children}
      {hint && <span className="text-[11.5px] text-text-tertiary">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "rounded-md border border-border bg-bg-panel px-2.5 py-1.5 text-[13px] text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors";

export function TimeInput({ value, onChange, className = "" }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} tabular w-[100px] ${className}`}
    />
  );
}

const STATUS_LABELS: Record<DayStatus, string> = {
  WERKTAG: "Werktag",
  WOCHENENDE: "Wochenende",
  FEIERTAG: "Feiertag",
  FERIEN: "Ferien",
  KRANK: "Krank",
  URLAUB: "Urlaub",
};

export function StatusBadge({ status, label }: { status: DayStatus; label?: string }) {
  const map: Record<DayStatus, string> = {
    WERKTAG: "bg-bg-hover text-text-secondary",
    WOCHENENDE: "bg-[var(--status-weekend-bg)] text-[var(--status-weekend-fg)]",
    FEIERTAG: "bg-[var(--status-holiday-bg)] text-[var(--status-holiday-fg)]",
    FERIEN: "bg-[var(--status-ferien-bg)] text-[var(--status-ferien-fg)]",
    KRANK: "bg-[var(--status-krank-bg)] text-[var(--status-krank-fg)]",
    URLAUB: "bg-[var(--status-urlaub-bg)] text-[var(--status-urlaub-fg)]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-medium ${map[status]}`}>
      {label ?? STATUS_LABELS[status]}
    </span>
  );
}
