"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push("/login");
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    async function load() {
      if (!profile) return;

      const res = await fetch(`/api/notifications?userId=${profile.id}`);
      const json = await res.json();
      setNotifications(json.data ?? []);
      setLoading(false);
    }
    load();
  }, [profile]);

  async function markAllRead() {
    if (!profile) return;

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profile.id }),
    });

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    if (!profile) return;

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id], userId: profile.id }),
    });

    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (authLoading || loading || !profile) {
    return (
      <div className="min-h-screen bg-parchment p-6 md:p-12">
        <div className="mx-auto max-w-2xl">
          <div className="h-8 w-48 animate-pulse rounded bg-ink/10" />
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <header className="border-b border-ink/10 bg-parchment-dim/50">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="focus-ring rounded-sm p-1 text-ink/40 hover:text-ink" aria-label="Go back">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 4l-6 6 6 6" />
              </svg>
            </button>
            <h1 className="font-display text-2xl text-ink">Notifications</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-brass/10 px-2.5 py-0.5 font-mono text-xs text-brass-dark">
                {unreadCount} unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="focus-ring rounded-sm text-sm text-ink/50 hover:text-ink">
              Mark all as read
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-6">
        {notifications.length === 0 ? (
          <div className="rounded-card border border-ink/15 bg-parchment-dim p-8 text-center">
            <p className="text-ink/50">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`focus-ring w-full rounded-card border p-4 text-left transition-colors ${
                  n.read
                    ? "border-ink/10 bg-parchment"
                    : "border-brass/20 bg-brass/5 hover:bg-brass/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-[15px] ${n.read ? "text-ink/70" : "font-medium text-ink"}`}>
                      {n.title}
                    </p>
                    <p className="mt-1 text-sm text-ink/50">{n.message}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!n.read && <span className="h-2 w-2 rounded-full bg-brass" />}
                    <span className="whitespace-nowrap text-xs text-ink/40">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
