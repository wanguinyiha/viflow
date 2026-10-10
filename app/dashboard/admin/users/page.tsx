"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/lib/context/AuthContext";
import Modal from "@/components/ui/Modal";
import SlideOver from "@/components/ui/SlideOver";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { showToast } from "@/components/ui/Toast";
import type { Room } from "@/lib/types";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  rooms?: { room_number: string; block: string } | null;
  id_verified?: boolean;
  photo_verified?: boolean;
  vehicle_plate?: string | null;
}

interface ResidentRow {
  id: string;
  user_id: string;
  student_number: string | null;
  status: string;
  created_at: string;
  profile: { id: string; full_name: string; email: string; phone: string | null } | null;
  room: { id: string; room_number: string; block: string; floor: number } | null;
}

interface VisitorListRow {
  id?: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone?: string | null;
  created_at: string;
  id_verified?: boolean;
  photo_verified?: boolean;
}

interface CreateUserPayload {
  action: "create_user";
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: string;
  roomId?: string;
  studentNumber?: string;
}

async function fetchUserRows(): Promise<UserRow[]> {
  try {
    const [usersRes, residentsRes, visitorsRes] = await Promise.all([
      fetch("/api/admin/data?type=users"),
      fetch("/api/admin/data?type=residents"),
      fetch("/api/admin/data?type=visitor_profiles"),
    ]);
    const usersData = await usersRes.json();
    const residentsData = await residentsRes.json();
    const visitorsData = await visitorsRes.json();

    const residents: UserRow[] = (residentsData.residents ?? []).map((r: ResidentRow) => ({
      id: r.profile?.id ?? r.user_id,
      full_name: r.profile?.full_name ?? "Unknown",
      email: r.profile?.email ?? "",
      phone: r.profile?.phone ?? null,
      role: "resident",
      created_at: r.created_at,
      rooms: r.room ? { room_number: r.room.room_number, block: r.room.block } : null,
    }));

    const visitors: UserRow[] = (visitorsData.visitors ?? []).map((v: VisitorListRow) => ({
      id: v.user_id ?? v.id,
      full_name: v.full_name,
      email: v.email,
      phone: v.phone,
      role: "visitor",
      created_at: v.created_at,
      id_verified: v.id_verified,
      photo_verified: v.photo_verified,
    }));

    const guards: UserRow[] = (usersData.users ?? [])
      .filter((u: UserRow) => u.role === "guard")
      .map((u: UserRow) => ({ ...u }));

    const admins: UserRow[] = (usersData.users ?? [])
      .filter((u: UserRow) => u.role === "admin")
      .map((u: UserRow) => ({ ...u }));

    return [...admins, ...residents, ...visitors, ...guards];
  } catch {
    return [];
  }
}

const ROLE_TABS = ["all", "resident", "visitor", "guard", "admin"] as const;
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-brass/20 text-ink",
  guard: "bg-sage/20 text-ink",
  resident: "bg-ink/10 text-ink",
  visitor: "bg-parchment-dim text-ink/60",
};

export default function UsersPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [form, setForm] = useState({
    email: "", password: "", fullName: "", phone: "", role: "resident",
    roomId: "", studentNumber: "",
  });
  const [creating, setCreating] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setUsers(await fetchUserRows());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading || !profile) return;
    async function fetchInitialUsers() {
      setUsers(await fetchUserRows());
      setLoading(false);
    }
    fetchInitialUsers();
  }, [authLoading, profile]);

  async function loadAvailableRooms() {
    try {
      const res = await fetch("/api/admin/data?type=rooms");
      const data = await res.json();
      setAvailableRooms(data.rooms ?? []);
    } catch {
      setAvailableRooms([]);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const payload: CreateUserPayload = {
        action: "create_user",
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
        role: form.role,
      };

      // Add room assignment for residents
      if (form.role === "resident") {
        if (!form.roomId) {
          showToast("Please select a room for the resident", "error");
          setCreating(false);
          return;
        }
        payload.roomId = form.roomId;
        payload.studentNumber = form.studentNumber;
      }

      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) {
        showToast(data.error, "error");
        return;
      }
      showToast(`${form.role.charAt(0).toUpperCase() + form.role.slice(1)} account created`, "success");
      setShowCreate(false);
      setForm({ email: "", password: "", fullName: "", phone: "", role: "resident", roomId: "", studentNumber: "" });
      loadUsers();
    } catch {
      showToast("Failed to create account", "error");
    }
    setCreating(false);
  }

  async function handleDeactivate(user: UserRow) {
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate_user", userId: user.id }),
      });
      const data = await res.json();
      if (data.error) {
        showToast(data.error, "error");
        return;
      }
      showToast("User deactivated", "success");
      loadUsers();
    } catch {
      showToast("Failed to deactivate", "error");
    }
  }

  const filtered = users.filter((u) => {
    const matchTab = activeTab === "all" || u.role === activeTab;
    const matchSearch = !search ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    all: users.length,
    resident: users.filter((u) => u.role === "resident").length,
    visitor: users.filter((u) => u.role === "visitor").length,
    guard: users.filter((u) => u.role === "guard").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  if (authLoading || loading || !profile) {
    return (
      <DashboardShell role="admin" roleLabel="Administrator" personName="Loading…">
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />)}</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" roleLabel="Administrator" personName={profile.full_name}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl italic text-ink">Users</h1>
          <p className="mt-1 text-sm text-ink/50">Manage residents, visitors, guards, and admins.</p>
        </div>
        <button
          onClick={() => {
            setShowCreate(true);
            loadAvailableRooms();
          }}
          className="focus-ring rounded-card bg-ink px-4 py-2 text-sm font-medium text-parchment hover:bg-ink-light transition-colors"
        >
          + Create Account
        </button>
      </div>

      {/* Role Tabs */}
      <div className="mt-6 flex gap-1 rounded-card border border-ink/10 bg-parchment-dim p-1">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`focus-ring flex-1 rounded-sm px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-ink text-parchment" : "text-ink/60 hover:text-ink"
            }`}
          >
            {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="ml-1.5 text-xs opacity-60">({counts[tab as keyof typeof counts]})</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="focus-ring rounded-card border border-ink/15 bg-parchment px-4 py-2 text-sm text-ink placeholder:text-ink/40 w-full max-w-sm"
        />
      </div>

      <div className="mt-4 rounded-card border border-ink/10 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 bg-parchment-dim">
            <tr>
              <th className="px-4 py-3 font-medium text-ink/70">Name</th>
              <th className="px-4 py-3 font-medium text-ink/70">Role</th>
              <th className="px-4 py-3 font-medium text-ink/70">
                {activeTab === "resident" ? "Room" : activeTab === "visitor" ? "Verified" : "Phone"}
              </th>
              <th className="px-4 py-3 font-medium text-ink/70">Created</th>
              <th className="px-4 py-3 font-medium text-ink/70 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-parchment-dim/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/10 text-xs font-medium text-ink">{u.full_name.charAt(0)}</div>
                    <div>
                      <p className="font-medium text-ink">{u.full_name}</p>
                      <p className="text-xs text-ink/50">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role] ?? "bg-ink/10 text-ink"}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3 text-ink/60">
                  {u.role === "resident" && u.rooms ? `Block ${u.rooms.block} — Room ${u.rooms.room_number.replace(/^[AB]-/, "")}` :
                   u.role === "resident" ? <span className="text-brass text-xs font-medium">Unassigned</span> :
                   u.role === "visitor" ? (
                    <span className={`text-xs font-medium ${u.id_verified ? "text-sage" : "text-ink/40"}`}>
                      {u.id_verified ? "✓ Verified" : "Pending"}
                    </span>
                   ) :
                   u.phone || "—"}
                </td>
                <td className="px-4 py-3 text-ink/50">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSelectedUser(u)} className="text-xs text-ink/50 hover:text-ink mr-3">View</button>
                  {u.role !== "admin" && (
                    <button onClick={() => setDeleteTarget(u)} className="text-xs text-red-500 hover:text-red-700">Deactivate</button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Account">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value, roomId: "", studentNumber: "" })}
              className="focus-ring w-full rounded-card border border-ink/15 bg-parchment px-3 py-2 text-sm"
            >
              <option value="resident">Resident</option>
              <option value="guard">Guard</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Full Name</label>
            <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="focus-ring w-full rounded-card border border-ink/15 bg-parchment px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="focus-ring w-full rounded-card border border-ink/15 bg-parchment px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="focus-ring w-full rounded-card border border-ink/15 bg-parchment px-3 py-2 text-sm" />
          </div>

          {form.role === "resident" && (
            <>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Block & Room *</label>
                <select
                  required
                  value={form.roomId}
                  onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                  className="focus-ring w-full rounded-card border border-ink/15 bg-parchment px-3 py-2 text-sm"
                >
                  <option value="">Select a room…</option>
                  {["A", "B"].map((block) => (
                    <optgroup key={block} label={`Block ${block}`}>
                      {availableRooms
                        .filter((r) => r.block === block)
                        .map((room) => (
                          <option key={room.id} value={room.id} disabled={room.is_occupied}>
                            Block {room.block} — Room {room.room_number.replace(/^[AB]-/, "")}{room.is_occupied ? " (Occupied)" : ""}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
                {availableRooms.length === 0 && (
                  <p className="mt-1 text-xs text-brass">No unoccupied rooms available. Assign rooms from the Rooms page first.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Student Number (optional)</label>
                <input value={form.studentNumber} onChange={(e) => setForm({ ...form, studentNumber: e.target.value })} className="focus-ring w-full rounded-card border border-ink/15 bg-parchment px-3 py-2 text-sm" />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Password</label>
            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="focus-ring w-full rounded-card border border-ink/15 bg-parchment px-3 py-2 text-sm"
              placeholder="Minimum 8 characters"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="focus-ring rounded-card border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5">Cancel</button>
            <button type="submit" disabled={creating} className="focus-ring rounded-card bg-ink px-4 py-2 text-sm font-medium text-parchment hover:bg-ink-light disabled:opacity-50">
              {creating ? "Creating…" : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>

      <SlideOver open={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Details">
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink/10 text-xl font-medium text-ink">{selectedUser.full_name.charAt(0)}</div>
              <div>
                <p className="font-display text-lg text-ink">{selectedUser.full_name}</p>
                <p className="text-sm text-ink/50">{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-ink/50">Role</span><p className="font-medium text-ink capitalize">{selectedUser.role}</p></div>
              <div><span className="text-ink/50">Phone</span><p className="font-medium text-ink">{selectedUser.phone || "—"}</p></div>
              <div><span className="text-ink/50">Created</span><p className="font-medium text-ink">{new Date(selectedUser.created_at).toLocaleDateString()}</p></div>
              {selectedUser.role === "resident" && (
                <div><span className="text-ink/50">Room</span><p className="font-medium text-ink">
                  {selectedUser.rooms ? `Block ${selectedUser.rooms.block} — Room ${selectedUser.rooms.room_number.replace(/^[AB]-/, "")}` : "Unassigned"}
                </p></div>
              )}
              {selectedUser.role === "visitor" && (
                <>
                  <div><span className="text-ink/50">ID Verified</span><p className="font-medium text-ink">{selectedUser.id_verified ? "✓ Yes" : "—"}</p></div>
                </>
              )}
            </div>
          </div>
        )}
      </SlideOver>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) handleDeactivate(deleteTarget); setDeleteTarget(null); }}
        title="Deactivate User"
        message={`Deactivate ${deleteTarget?.full_name}? Their role will be changed to visitor.`}
        confirmLabel="Deactivate"
        variant="danger"
      />
    </DashboardShell>
  );
}
