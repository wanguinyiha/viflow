"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import FilterBar from "@/components/ui/FilterBar";
import SlideOver from "@/components/ui/SlideOver";
import { useAuth } from "@/lib/context/AuthContext";

interface VehicleRow {
  id: string;
  visitor_id: string;
  registration_number: string;
  make: string | null;
  model: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  visitor?: {
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
}

export default function AdminVehiclesPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRow | null>(null);

  useEffect(() => {
    if (authLoading || !profile) return;
    loadVehicles();
  }, [authLoading, profile]);

  async function loadVehicles() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/data?type=vehicles");
      const data = await res.json();
      setVehicles(data.vehicles ?? []);
    } catch {
      setVehicles([]);
    }
    setLoading(false);
  }

  const columns: Column<VehicleRow>[] = [
    {
      key: "registration_number",
      label: "Registration",
      render: (row) => (
        <span className="font-mono text-sm text-ink">
          {row.registration_number}
        </span>
      ),
    },
    {
      key: "make",
      label: "Make",
      render: (row) => row.make ?? "\u2014",
    },
    {
      key: "model",
      label: "Model",
      render: (row) => row.model ?? "\u2014",
    },
    {
      key: "color",
      label: "Color",
      render: (row) => row.color ?? "\u2014",
    },
    {
      key: "visitor_id",
      label: "Visitor",
      render: (row) => row.visitor?.full_name ?? "\u2014",
    },
    {
      key: "is_active",
      label: "Active",
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs uppercase ${
            row.is_active
              ? "bg-sage/10 text-sage-dim border-sage/20"
              : "bg-ink/5 text-ink/50 border-ink/10"
          }`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  if (authLoading || loading || !profile) {
    return (
      <DashboardShell role="admin" roleLabel="Administrator" personName="Loading\u2026">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-card border border-ink/10 bg-parchment-dim"
            />
          ))}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" roleLabel="Administrator" personName={profile.full_name}>
      <PageHeader
        title="Vehicles"
        description="View all registered visitor vehicles."
      />

      <div className="mt-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by registration or visitor name\u2026"
        />
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={vehicles}
          search={search}
          onRowClick={(row) => setSelectedVehicle(row)}
        />
      </div>

      <SlideOver
        open={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        title="Vehicle Details"
      >
        {selectedVehicle && (
          <div className="space-y-6">
            <div>
              <p className="font-mono text-lg text-ink">
                {selectedVehicle.registration_number}
              </p>
              <span
                className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs uppercase ${
                  selectedVehicle.is_active
                    ? "bg-sage/10 text-sage-dim border-sage/20"
                    : "bg-ink/5 text-ink/50 border-ink/10"
                }`}
              >
                {selectedVehicle.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="border-t border-ink/10 pt-4">
              <h3 className="font-display text-lg text-ink">Vehicle Info</h3>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-ink/50">Make</span>
                  <p className="font-medium text-ink">
                    {selectedVehicle.make ?? "\u2014"}
                  </p>
                </div>
                <div>
                  <span className="text-ink/50">Model</span>
                  <p className="font-medium text-ink">
                    {selectedVehicle.model ?? "\u2014"}
                  </p>
                </div>
                <div>
                  <span className="text-ink/50">Color</span>
                  <p className="font-medium text-ink">
                    {selectedVehicle.color ?? "\u2014"}
                  </p>
                </div>
                <div>
                  <span className="text-ink/50">Registration</span>
                  <p className="font-mono font-medium text-ink">
                    {selectedVehicle.registration_number}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-4">
              <h3 className="font-display text-lg text-ink">Visitor</h3>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-ink/50">Name</span>
                  <p className="font-medium text-ink">
                    {selectedVehicle.visitor?.full_name ?? "\u2014"}
                  </p>
                </div>
                <div>
                  <span className="text-ink/50">Email</span>
                  <p className="font-medium text-ink">
                    {selectedVehicle.visitor?.email ?? "\u2014"}
                  </p>
                </div>
                <div>
                  <span className="text-ink/50">Phone</span>
                  <p className="font-medium text-ink">
                    {selectedVehicle.visitor?.phone ?? "\u2014"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-ink/50">Registered</span>
                  <p className="font-medium text-ink">
                    {new Date(selectedVehicle.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-ink/50">Last Updated</span>
                  <p className="font-medium text-ink">
                    {new Date(selectedVehicle.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </DashboardShell>
  );
}