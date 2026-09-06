"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import FilterBar from "@/components/ui/FilterBar";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

export default function GuardsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [guards, setGuards] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);

      const { data } = await supabase.from("profiles").select("*").eq("role", "guard").order("full_name");
      setGuards((data ?? []) as Profile[]);
      setLoading(false);
    }
    load();
  }, []);

  const columns: Column<Profile>[] = [
    { key: "full_name", label: "Name", render: (row) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-ink/10 text-ink/40 flex items-center justify-center text-xs font-medium">{row.full_name.charAt(0)}</div>
        <div>
          <p className="text-sm font-medium text-ink">{row.full_name}</p>
          <p className="text-xs text-ink/40">{row.email}</p>
        </div>
      </div>
    )},
    { key: "phone", label: "Phone", render: (row) => row.phone ?? "—" },
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
      <PageHeader title="Guards" description="Manage guard accounts." />

      <div className="mt-6">
        <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search by name or email…" />
      </div>

      <div className="mt-6">
        <DataTable columns={columns} data={guards} search={search} />
      </div>
    </DashboardShell>
  );
}
