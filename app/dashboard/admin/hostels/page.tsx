"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import FilterBar from "@/components/ui/FilterBar";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

interface Hostel {
  id: string;
  name: string;
  created_at: string;
}

export default function HostelsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);

      const { data } = await supabase.from("hostels").select("*").order("name");
      setHostels((data ?? []) as Hostel[]);
      setLoading(false);
    }
    load();
  }, []);

  const columns: Column<Hostel>[] = [
    { key: "name", label: "Name", render: (row) => <span className="font-medium text-ink">{row.name}</span> },
    { key: "created_at", label: "Created", render: (row) => new Date(row.created_at).toLocaleDateString(), sortable: true },
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
      <PageHeader title="Hostels" description="Manage hostel buildings." />

      <div className="mt-6">
        <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search hostels…" />
      </div>

      <div className="mt-6">
        {hostels.length === 0 ? (
          <p className="text-sm text-ink/50">No hostels found. Use the seed endpoint or database to create hostels.</p>
        ) : (
          <DataTable columns={columns} data={hostels} search={search} />
        )}
      </div>
    </DashboardShell>
  );
}
