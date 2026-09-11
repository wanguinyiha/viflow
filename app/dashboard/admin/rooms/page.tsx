"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/lib/context/AuthContext";
import SlideOver from "@/components/ui/SlideOver";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { showToast } from "@/components/ui/Toast";

interface RoomRow {
  id: string;
  room_number: string;
  block: string;
  floor: number;
  is_occupied: boolean;
  resident: {
    id: string;
    user_id: string;
    student_number: string | null;
    status: string;
    profile: { id: string; full_name: string; email: string } | null;
  } | null;
  created_at: string;
}

const BLOCKS = ["A", "B"];

export default function RoomsPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<RoomRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoomRow | null>(null);

  useEffect(() => {
    if (authLoading || !profile) return;
    loadRooms();
  }, [authLoading, profile]);

  async function loadRooms() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/data?type=rooms");
      const data = await res.json();
      setRooms(data.rooms ?? []);
    } catch { setRooms([]); }
    setLoading(false);
  }

  async function handleUnassign(residentProfileId: string) {
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unassign_room", residentProfileId }),
      });
      const data = await res.json();
      if (data.error) { showToast(data.error, "error"); return; }
      showToast("Resident removed from room", "success");
      setSelectedRoom(null);
      loadRooms();
    } catch { showToast("Failed", "error"); }
  }

  async function handleDelete(room: RoomRow) {
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_room", roomId: room.id }),
      });
      const data = await res.json();
      if (data.error) { showToast(data.error, "error"); return; }
      showToast("Room deleted", "success");
      setSelectedRoom(null);
      loadRooms();
    } catch { showToast("Failed", "error"); }
  }

  const filtered = rooms.filter((r) => {
    const matchBlock = !blockFilter || r.block === blockFilter;
    const matchStatus = !statusFilter || (statusFilter === "occupied" ? r.is_occupied : !r.is_occupied);
    const matchSearch = !search || `Block ${r.block} Room ${r.room_number.replace(/^[AB]-/, "")}`.toLowerCase().includes(search.toLowerCase()) ||
      r.resident?.profile?.full_name?.toLowerCase().includes(search.toLowerCase());
    return matchBlock && matchStatus && matchSearch;
  });

  const blockA = rooms.filter((r) => r.block === "A").length;
  const blockB = rooms.filter((r) => r.block === "B").length;
  const occupied = rooms.filter((r) => r.is_occupied).length;

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
          <h1 className="font-display text-3xl italic text-ink">Rooms</h1>
          <p className="mt-1 text-sm text-ink/50">Block A: {blockA} rooms &middot; Block B: {blockB} rooms &middot; {occupied} occupied</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input type="text" placeholder="Search rooms or residents…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="focus-ring rounded-card border border-ink/15 bg-parchment px-4 py-2 text-sm text-ink placeholder:text-ink/40 w-64" />
        <select value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}
          className="focus-ring rounded-card border border-ink/15 bg-parchment px-4 py-2 text-sm">
          <option value="">All blocks</option>
          {BLOCKS.map((b) => <option key={b} value={b}>Block {b}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="focus-ring rounded-card border border-ink/15 bg-parchment px-4 py-2 text-sm">
          <option value="">All rooms</option>
          <option value="occupied">Occupied</option>
          <option value="vacant">Vacant</option>
        </select>
      </div>

      {/* Room Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {filtered.map((room) => (
          <button
            key={room.id}
            onClick={() => setSelectedRoom(room)}
            className={`focus-ring rounded-card border p-4 text-left transition-colors hover:border-ink/25 ${
              room.is_occupied ? "border-sage/30 bg-sage/5" : "border-ink/15 bg-parchment-dim"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-medium text-ink">Block {room.block} — Room {room.room_number.replace(/^[AB]-/, "")}</span>
              <span className={`text-xs font-medium ${room.is_occupied ? "text-sage" : "text-ink/40"}`}>
                {room.is_occupied ? "Occupied" : "Vacant"}
              </span>
            </div>
            {room.resident?.profile ? (
              <p className="mt-2 text-sm text-ink/60">{room.resident.profile.full_name}</p>
            ) : (
              <p className="mt-2 text-sm text-ink/30 italic">No resident</p>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-ink/40">No rooms found.</p>
      )}

      {/* Detail SlideOver */}
      <SlideOver open={!!selectedRoom} onClose={() => setSelectedRoom(null)} title={`Block ${selectedRoom?.block} — Room ${selectedRoom?.room_number.replace(/^[AB]-/, "")}`}>
        {selectedRoom && (
          <div className="space-y-6">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-ink/50">Block</dt><dd className="font-medium text-ink">Block {selectedRoom.block}</dd></div>
              <div><dt className="text-ink/50">Room</dt><dd className="font-mono font-medium text-ink">{selectedRoom.room_number}</dd></div>
              <div><dt className="text-ink/50">Floor</dt><dd className="text-ink">{selectedRoom.floor}</dd></div>
              <div><dt className="text-ink/50">Status</dt><dd>
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${selectedRoom.is_occupied ? "bg-sage/20 text-ink" : "bg-ink/10 text-ink/60"}`}>
                  {selectedRoom.is_occupied ? "Occupied" : "Vacant"}
                </span>
              </dd></div>
            </dl>

            {selectedRoom.is_occupied && selectedRoom.resident && (
              <div className="rounded-card border border-ink/10 p-4">
                <p className="text-xs text-ink/50 mb-1">Current Resident</p>
                <p className="font-medium text-ink">{selectedRoom.resident.profile?.full_name ?? "Unknown"}</p>
                <p className="text-sm text-ink/50">{selectedRoom.resident.profile?.email}</p>
                {selectedRoom.resident.student_number && (
                  <p className="text-sm text-ink/50">Student #{selectedRoom.resident.student_number}</p>
                )}
                <p className="text-xs text-ink/40 mt-1">Status: {selectedRoom.resident.status}</p>
                <button onClick={() => handleUnassign(selectedRoom.resident!.id)} className="mt-3 text-xs text-red-500 hover:text-red-700">Remove from room</button>
              </div>
            )}

            {!selectedRoom.is_occupied && (
              <div className="rounded-card border border-ink/10 p-4">
                <p className="text-sm text-ink/50">This room is vacant. Assign a resident from the Residents page.</p>
                <a href="/dashboard/admin/residents" className="mt-2 inline-block text-sm font-medium text-ink underline underline-offset-2 hover:text-ink/80">
                  Go to Residents
                </a>
              </div>
            )}

            <div className="border-t border-ink/10 pt-4">
              <button onClick={() => setDeleteTarget(selectedRoom)} className="text-xs text-red-500 hover:text-red-700">Delete room</button>
            </div>
          </div>
        )}
      </SlideOver>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget); setDeleteTarget(null); }}
        title="Delete Room"
        message={`Delete Block ${deleteTarget?.block} — Room ${deleteTarget?.room_number.replace(/^[AB]-/, "")}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </DashboardShell>
  );
}
