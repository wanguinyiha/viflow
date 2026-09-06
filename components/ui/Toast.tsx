"use client";

import { useState, useEffect } from "react";

export default function Toast({
  message,
  type = "success",
  onClose,
  duration = 4000,
}: {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onClose: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const styles = {
    success: "border-sage bg-sage/10 text-sage-dim",
    error: "border-red-300 bg-red-50 text-red-700",
    warning: "border-brass bg-brass/10 text-brass-dark",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-card border px-4 py-3 text-sm shadow-lg ${styles[type]}`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-current opacity-60 hover:opacity-100" aria-label="Dismiss">
        &times;
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

  const show = (message: string, type: "success" | "error" | "warning" | "info" = "success") => {
    setToast({ message, type });
  };

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
  ) : null;

  return { show, ToastComponent };
}
