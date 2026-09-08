"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import Modal from "@/components/ui/Modal";
import SlideOver from "@/components/ui/SlideOver";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { showToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/context/AuthContext";
import type { Profile } from "@/lib/types";

export default function GuardsPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [guards, setGuards] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "" });
  const [creating, setCreating] = useState(false);

  // View slide-over
  const [selectedGuard, setSelectedGuard] = useState<Profile | null>(null);

  // Deactivate confirmation
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);

  useEffect(() => {
    if (authLoading || !profile) return;
    loadGuards();
  }, [authLoading, profile]);

  async function loadGuards() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/data?type=guards");
      const data = await res.json();
      setGuards(data.guards ?? []);
    } catch {
      setGuards([]);
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_user",
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          phone: form.phone,
          role: "guard",
        }),
      });
      const data = await res.json();
      if (data.error) {
        showToast(data.error, "error");
        return;
      }
      showToast("Guard account created successfully", "success");
      setShowCreate(false);
      setForm({ email: "", password: "", fullName: "", phone: "" });
      loadGuards();
    } catch {
      showToast("Failed to create guard account", "error");
    }
    setCreating(false);
  }

  async function handleDeactivate(guard: Profile) {
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate_user", userId: guard.id }),
      });
      const data = await res.json();
      if (data.error) {
        showToast(data.error, "error");
        return;
      }
      showToast("Guard deactivated", "success");
      loadGuards();
    } catch {
      showToast("Failed to deactivate guard", "error");
    }
  }

  const filtered = guards.filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return g.full_name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q);
  });

  if (authLoading || loading || !profile) {
    return (
      <DashboardShell role="admin" roleLabel="Administrator" personName="Loading...">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
          ))}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" roleLabel="Administrator" personName={profile.full_name}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl italic text-ink">Guards</h1>
          <p className="mt-1 text-sm text-ink/50">Manage guard accounts.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="focus-ring rounded-card bg-ink px-4 py-2 text-sm font-medium text-parchment hover:bg-ink-light transition-colors"
        >
          + Create Guard
        </button>
      </div>

      <div className="mt-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="focus-ring rounded-card border border-ink/15 bg-parchment px-4 py-2 text-sm text-ink placeholder:text-ink/40 w-64"
        />
      </div>

      <div className="mt-4 rounded-card border border-ink/10 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 bg-parchment-dim">
            <tr>
              <th className="px-4 py-3 font-medium text-ink/70">Name</th>
              <th className="px-4 py-3 font-medium text-ink/70">Phone</th>
              <th className="px-4 py-3 font-medium text-ink/70">Created</th>
              <th className="px-4 py-3 font-medium text-ink/70 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {filtered.map((g) => (
              <tr key={g.id} className="hover:bg-parchment-dim/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/10 text-xs font-medium text-ink">
                      {g.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-ink">{g.full_name}</p>
                      <p className="text-xs text-ink/50">{g.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink/60">{g.phone || "\u2014"}</td>
                <td className="px-4 py-3 text-ink/50">{new Date(g.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelectedGuard(g)}
                    className="text-xs text-ink/50 hover:text-ink mr-3"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setDeleteTarget(g)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink/40">
                  No guards found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Guard Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Guard">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Full Name</label>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="focus-ring w-full rounded-card border border-ink/15 bg-parchment px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="focus-ring w-full rounded-card border border-ink/15 bg-parchment px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="focus-ring w-full rounded-card border border-ink/15 bg-parchment px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Password</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="focus-ring w-full rounded-card border border-ink/15 bg-parchment px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="focus-ring rounded-card border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="focus-ring rounded-card bg-ink px-4 py-2 text-sm font-medium text-parchment hover:bg-ink-light disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Guard"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Guard Detail SlideOver */}
      <SlideOver open={!!selectedGuard} onClose={() => setSelectedGuard(null)} title="Guard Details">
        {selectedGuard && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink/10 text-xl font-medium text-ink">
                {selectedGuard.full_name.charAt(0)}
              </div>
              <div>
                <p className="font-display text-lg text-ink">{selectedGuard.full_name}</p>
                <p className="text-sm text-ink/50">{selectedGuard.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-ink/50">Role</span>
                <p className="font-medium text-ink capitalize">{selectedGuard.role}</p>
              </div>
              <div>
                <span className="text-ink/50">Phone</span>
                <p className="font-medium text-ink">{selectedGuard.phone || "\u2014"}</p>
              </div>
              <div>
                <span className="text-ink/50">Created</span>
                <p className="font-medium text-ink">{new Date(selectedGuard.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-ink/50">User ID</span>
                <p className="font-mono text-xs text-ink/40">{selectedGuard.id.slice(0, 8)}...</p>
              </div>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) handleDeactivate(deleteTarget);
          setDeleteTarget(null);
        }}
        title="Deactivate Guard"
        message={`Are you sure you want to deactivate ${deleteTarget?.full_name}? This will change their role to visitor.`}
        confirmLabel="Deactivate"
        variant="danger"
      />
    </DashboardShell>
  );
}
