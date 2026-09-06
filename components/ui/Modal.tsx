"use client";

import { useEffect, useRef } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={`rounded-card border border-ink/15 bg-parchment p-0 shadow-xl ${maxWidth} backdrop:bg-ink/30`}
    >
      <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <h2 className="font-display text-xl text-ink">{title}</h2>
        <button
          onClick={onClose}
          className="focus-ring rounded-sm p-1 text-ink/40 hover:text-ink"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4">{children}</div>
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "warning" | "info";
}) {
  const btnStyles = {
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-brass hover:bg-brass-dark text-parchment",
    info: "bg-ink hover:bg-ink-light text-parchment",
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-ink/70">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="focus-ring rounded-card border border-ink/20 px-4 py-2 text-sm text-ink hover:border-ink/40"
        >
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`focus-ring rounded-card px-4 py-2 text-sm font-medium ${btnStyles[variant]}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
