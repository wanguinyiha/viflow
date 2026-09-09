"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import Modal from "@/components/ui/Modal";
import SlideOver from "@/components/ui/SlideOver";
import { showToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/context/AuthContext";
import type { Room } from "@/lib/types";

interface ResidentRow {
  id: string;
  user_id: string;
  student_number: string | null;
  status: string;
  created_at: string;
  profile: { id: string; full_name: string; email: string; phone: string | null } | null;
  room: { id: string; room_number: string; block: string; floor: number } | null;
}

export default function ResidentsPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [residents, setResidents] = useState<ResidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Assign room modal
  const [showAssign, setShowAssign] = useState(false);
  const [assignTarget, setAssignTarget] = useState<ResidentRow | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Change room modal
  const [showChangeRoom, setShowChangeRoom] = useState(false);
  const [changeTarget, setChangeTarget] = useState<ResidentRow | null>(null);
  const [newRoomId, setNewRoomId] = useState("");
  const [changing, setChanging] = useState(false);

  // View slide-over
  const [selectedResident, setSelectedResident] = useState<ResidentRow | null>(null);

  const loadResidents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/data?type=residents");
      const data = await res.json();
      setResidents(data.residents ?? []);
    } catch {
      setResidents([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading || !profile) return;
    loadResidents();
  }, [authLoading, profile, loadResidents]);

  async function loadAvailableRooms() {
    try {
      const res = await fetch("/api/admin/data?type=rooms");
      const data = await res.json();
      const unoccupied = (data.rooms ?? []).filter((r: any) => !r.is_occupied);
      setAvailableRooms(unoccupied);
    } catch {
      setAvailableRooms([]);
    }
  }

  function openAssignRoom(resident: ResidentRow) {
    setAssignTarget(resident);
    setSelectedRoomId("");
    setShowAssign(true);
    loadAvailableRooms();
  }

  function openChangeRoom(resident: ResidentRow) {
    setChangeTarget(resident);
    setNewRoomId("");
    setShowChangeRoom(true);
    loadAvailableRooms();
  }

  async function handleAssignRoom() {
    if (!selectedRoomId || !assignTarget) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign_room", roomId: selectedRoomId, userId: assignTarget.user_id }),
      });
      const data = await res.json();
      if (data.error) {
        showToast(data.error, "error");
        return;
      }
      showToast("Room assigned successfully", "success");
      setShowAssign(false);
      setAssignTarget(null);
      setSelectedRoomId("");
      loadResidents();
    } catch {
      showToast("Failed to assign room", "error");
    }
    setAssigning(false);
  }

  async function handleChangeRoom() {
    if (!newRoomId || !changeTarget) return;
    setChanging(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_room", residentProfileId: changeTarget.id, newRoomId }),
      });
      const data = await res.json();
      if (data.error) {
        showToast(data.error, "error");
        return;
      }
      showToast("Room changed successfully", "success");
      setShowChangeRoom(false);
      setChangeTarget(null);
      setNewRoomId("");
      loadResidents();
    } catch {
      showToast("Failed to change room", "error");
    }
    setChanging(false);
  }

  async function handleUnassignRoom(resident: ResidentRow) {
    if (!resident.room) return;
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unassign_room", residentProfileId: resident.id }),
      });
      const data = await res.json();
      if (data.error) {
        showToast(data.error, "error");
        return;
      }
      showToast("Room unassigned", "success");
      setSelectedResident(null);
      loadResidents();
    } catch {
      showToast("Failed to unassign", "error");
    }
  }

  const filtered = residents.filter((r) => {
    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchSearch = !search ||
      r.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.room?.block?.toLowerCase().includes(search.toLowerCase()) ||
      r.room?.room_number?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

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
          <h1 className="font-display text-3xl italic text-ink">Residents</h1>
          <p className="mt-1 text-sm text-ink/50">Manage resident profiles and room assignments.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input type="text" placeholder="Search by name, email, or room…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="focus-ring rounded-card border border-ink/15 bg-parchment px-4 py-2 text-sm text-ink placeholder:text-ink/40 w-64" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="focus-ring rounded-card border border-ink/15 bg-parchment px-4 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="mt-4 rounded-card border border-ink/10 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 bg-parchment-dim">
            <tr>
              <th className="px-4 py-3 font-medium text-ink/70">Name</th>
              <th className="px-4 py-3 font-medium text-ink/70">Room</th>
              <th className="px-4 py-3 font-medium text-ink/70">Status</th>
              <th className="px-4 py-3 font-medium text-ink/70">Student #</th>
              <th className="px-4 py-3 font-medium text-ink/70 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-parchment-dim/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/10 text-xs font-medium text-ink">
                      {r.profile?.full_name?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <p className="font-medium text-ink">{r.profile?.full_name ?? "Unknown"}</p>
                      <p className="text-xs text-ink/50">{r.profile?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {r.room ? (
                    <span className="inline-block rounded-full bg-sage/20 px-2 py-0.5 text-xs font-medium text-ink">
                      Block {r.room.block} — Room {r.room.room_number}
                    </span>
                  ) : (
                    <span className="text-ink/40 text-xs">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "active" ? "bg-sage/20 text-ink" : "bg-ink/10 text-ink/40"}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/60 font-mono text-xs">{r.student_number ?? "—"}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => setSelectedResident(r)} className="text-xs text-ink/50 hover:text-ink">View</button>
                  {!r.room && (
                    <button onClick={() => openAssignRoom(r)} className="text-xs text-brass hover:text-brass-light">Assign Room</button>
                  )}
                  {r.room && (
                    <button onClick={() => openChangeRoom(r)} className="text-xs text-ink/50 hover:text-ink">Change Room</button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">No residents found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Resident Detail SlideOver */}
      <SlideOver open={!!selectedResident} onClose={() => setSelectedResident(null)} title="Resident Details">
        {selectedResident && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink/10 text-xl font-medium text-ink">
                {selectedResident.profile?.full_name?.charAt(0) ?? "?"}
              </div>
              <div>
                <p className="font-display text-lg text-ink">{selectedResident.profile?.full_name ?? "Unknown"}</p>
                <p className="text-sm text-ink/50">{selectedResident.profile?.email}</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-ink/50">Phone</dt><dd className="font-medium text-ink">{selectedResident.profile?.phone || "—"}</dd></div>
              <div><dt className="text-ink/50">Status</dt><dd>
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${selectedResident.status === "active" ? "bg-sage/20 text-ink" : "bg-ink/10 text-ink/40"}`}>
                  {selectedResident.status}
                </span>
              </dd></div>
              <div><dt className="text-ink/50">Student #</dt><dd className="font-mono text-ink">{selectedResident.student_number || "—"}</dd></div>
              <div><dt className="text-ink/50">Created</dt><dd className="text-ink">{new Date(selectedResident.created_at).toLocaleDateString()}</dd></div>
            </dl>

            <div className="border-t border-ink/10 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg text-ink">Room Assignment</h3>
                {!selectedResident.room && (
                  <button onClick={() => openAssignRoom(selectedResident)} className="focus-ring rounded-card bg-ink px-3 py-1.5 text-xs font-medium text-parchment hover:bg-ink-light transition-colors">
                    Assign Room
                  </button>
                )}
              </div>

              {selectedResident.room ? (
                <div className="mt-3 rounded-card border border-ink/10 bg-parchment-dim/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-ink">Block {selectedResident.room.block} — Room {selectedResident.room.room_number}</p>
                      <p className="text-sm text-ink/50">Floor {selectedResident.room.floor}</p>
                    </div>
                    <div className="space-x-2">
                      <button onClick={() => { setSelectedResident(null); openChangeRoom(selectedResident); }} className="text-xs text-ink/50 hover:text-ink">Change</button>
                      <button onClick={() => handleUnassignRoom(selectedResident)} className="text-xs text-red-500 hover:text-red-700">Unassign</button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-ink/40">No room assigned.</p>
              )}
            </div>
          </div>
        )}
      </SlideOver>

      {/* Assign Room Modal */}
      <Modal open={showAssign} onClose={() => { setShowAssign(false); setAssignTarget(null); setSelectedRoomId(""); }} title="Assign Room">
        <div className="space-y-4">
          <p className="text-sm text-ink/60">Select an unoccupied room to assign to {assignTarget?.profile?.full_name}.</p>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Room</label>
            <select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)}
              className="focus-ring w-full rounded-card border border-ink/15 bg-parchment px-3 py-2 text-sm">
              <option value="">Select a room…</option>
              {["A", "B"].map((block) => (
                <optgroup key={block} label={`Block ${block}`}>
                  {availableRooms
                    .filter((r) => r.block === block)
                    .map((room) => (
                      <option key={room.id} value={room.id}>Block {room.block} — Room {room.room_number}</option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
          {availableRooms.length === 0 && <p className="text-sm text-ink/40">No unoccupied rooms available.</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowAssign(false); setAssignTarget(null); setSelectedRoomId(""); }}
              className="focus-ring rounded-card border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5">Cancel</button>
            <button onClick={handleAssignRoom} disabled={!selectedRoomId || assigning}
              className="focus-ring rounded-card bg-ink px-4 py-2 text-sm font-medium text-parchment hover:bg-ink-light disabled:opacity-50">
              {assigning ? "Assigning…" : "Assign Room"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Change Room Modal */}
      <Modal open={showChangeRoom} onClose={() => { setShowChangeRoom(false); setChangeTarget(null); setNewRoomId(""); }} title="Change Room">
        <div className="space-y-4">
          <p className="text-sm text-ink/60">
            Change room for {changeTarget?.profile?.full_name}.
            {changeTarget?.room && ` Currently in Block ${changeTarget.room.block} — Room ${changeTarget.room.room_number}.`}
          </p>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">New Room</label>
            <select value={newRoomId} onChange={(e) => setNewRoomId(e.target.value)}
              className="focus-ring w-full rounded-card border border-ink/15 bg-parchment px-3 py-2 text-sm">
              <option value="">Select a room…</option>
              {["A", "B"].map((block) => (
                <optgroup key={block} label={`Block ${block}`}>
                  {availableRooms
                    .filter((r) => r.block === block)
                    .map((room) => (
                      <option key={room.id} value={room.id}>Block {room.block} — Room {room.room_number}</option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
          {availableRooms.length === 0 && <p className="text-sm text-ink/40">No unoccupied rooms available.</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowChangeRoom(false); setChangeTarget(null); setNewRoomId(""); }}
              className="focus-ring rounded-card border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5">Cancel</button>
            <button onClick={handleChangeRoom} disabled={!newRoomId || changing}
              className="focus-ring rounded-card bg-ink px-4 py-2 text-sm font-medium text-parchment hover:bg-ink-light disabled:opacity-50">
              {changing ? "Changing…" : "Change Room"}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
