"use client";

import { useEffect, useState } from "react";

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

let toastListeners: ((toasts: ToastItem[]) => void)[] = [];
let toastState: ToastItem[] = [];

function notifyListeners() {
  toastListeners.forEach((fn) => fn([...toastState]));
}

export function showToast(message: string, type: ToastItem["type"] = "info") {
  const id = Math.random().toString(36).slice(2);
  toastState = [...toastState, { id, message, type }];
  notifyListeners();
  setTimeout(() => {
    toastState = toastState.filter((t) => t.id !== id);
    notifyListeners();
  }, 3000);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => { toastListeners = toastListeners.filter((fn) => fn !== setToasts); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-card border px-4 py-3 text-sm font-medium shadow-lg ${
            t.type === "success" ? "border-sage/30 bg-sage/10 text-ink" :
            t.type === "error" ? "border-red-200 bg-red-50 text-red-800" :
            "border-ink/15 bg-parchment text-ink"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
