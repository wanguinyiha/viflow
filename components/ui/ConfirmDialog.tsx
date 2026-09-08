"use client";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", variant = "default" }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-md rounded-card border border-ink/15 bg-parchment p-6 shadow-xl">
        <h3 className="font-display text-lg text-ink">{title}</h3>
        <p className="mt-2 text-sm text-ink/70">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="focus-ring rounded-card border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`focus-ring rounded-card px-4 py-2 text-sm font-medium text-parchment transition-colors ${
              variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-ink hover:bg-ink-light"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
