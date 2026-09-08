"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}

export default function Modal({ open, onClose, title, children, wide }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={`rounded-card border border-ink/15 bg-parchment p-0 shadow-lg backdrop:bg-ink/30 ${wide ? "w-full max-w-2xl" : "w-full max-w-lg"}`}
    >
      <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <h2 className="font-display text-xl text-ink">{title}</h2>
        <button onClick={onClose} className="focus-ring rounded-sm p-1 text-ink/40 hover:text-ink" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>
      <div className="px-6 py-4">{children}</div>
    </dialog>
  );
}
