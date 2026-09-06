"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import FilterBar from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/FormField";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

interface RoomRow {
  id: string;
  room_number: string;
  block: string;
  floor: number;
  resident: { full_name: string; email: string } | null;
}

export default function RoomsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);

      const { data } = await supabase.from("rooms").select("*, resident:profiles!rooms_resident_id_fkey(full_name, email)").order("room_number");
      setRooms((data ?? []) as RoomRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = rooms.filter((r) => {
    if (statusFilter === "occupied" && !r.resident) return false;
    if (statusFilter === "vacant" && r.resident) return false;
    return true;
  });

  const columns: Column<RoomRow>[] = [
    { key: "room_number", label: "Room", render: (row) => <span className="font-mono text-sm font-medium text-ink">{row.room_number}</span>, sortable: true },
    { key: "block", label: "Block", render: (row) => row.block, sortable: true },
    { key: "floor", label: "Floor", render: (row) => row.floor, sortable: true },
    { key: "resident", label: "Resident", render: (row) => row.resident ? (
      <div>
        <p className="text-sm text-ink">{row.resident.full_name}</p>
        <p className="text-xs text-ink/40">{row.resident.email}</p>
      </div>
    ) : <span className="text-sm text-ink/30">Vacant</span> },
    { key: "status", label: "Status", render: (row) => (
      <span className={`inline-block rounded-sm border px-2 py-0.5 text-xs font-mono ${
        row.resident ? "border-sage/20 bg-sage/10 text-sage-dim" : "border-ink/20 bg-ink/5 text-ink/40"
      }`}>
        {row.resident ? "Occupied" : "Vacant"}
      </span>
    )},
  ];

  if (loading || !profile) {
    return (
      <DashboardShell role="admin" roleLabel="Administrator" personName="Loading…">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" roleLabel="Administrator" personName={profile.full_name}>
      <PageHeader title="Rooms" description="Manage hostel rooms and assignments." />

      <div className="mt-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by room number…"
          filters={
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
              <option value="">All rooms</option>
              <option value="occupied">Occupied</option>
              <option value="vacant">Vacant</option>
            </Select>
          }
        />
      </div>

      <div className="mt-6">
        <DataTable columns={columns} data={filtered} search={search} />
      </div>
    </DashboardShell>
  );
}
