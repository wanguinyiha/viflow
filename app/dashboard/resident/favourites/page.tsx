"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { showToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/lib/context/AuthContext";
import { getFavouriteVisitors, removeFavourite } from "@/lib/api/favourites";
import type { FavouriteVisitor } from "@/lib/types";

export default function FavouritesPage() {
  const { user: profile } = useAuth();
  const [favourites, setFavourites] = useState<FavouriteVisitor[]>([]);
  const [loading, setLoading] = useState(true);
 const [removeId, setRemoveId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!profile) return;
      const { data } = await getFavouriteVisitors(profile.id);
      setFavourites(data);
      setLoading(false);
    }
    load();
  }, [profile]);

  async function handleRemove() {
    if (!removeId) return;
    const { error } = await removeFavourite(removeId);
    if (!error) {
      setFavourites((prev) => prev.filter((f) => f.id !== removeId));
      showToast("Removed from favourites.");
    }
    setRemoveId(null);
  }

  if (loading || !profile) {
    return (
      <DashboardShell role="resident" roleLabel="Resident" personName="Loading…">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="resident" roleLabel="Resident" personName={profile.full_name}>
          <PageHeader title="Favourite Visitors" description="Quick access to your frequent visitors." />

      <div className="mt-8">
        {favourites.length === 0 ? (
          <EmptyState
            title="No favourites yet"
            description="Add frequent visitors to your favourites for faster invitations."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favourites.map((fav) => (
              <div key={fav.id} className="rounded-card border border-ink/15 bg-parchment-dim p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-ink/10 text-ink/40 flex items-center justify-center text-sm font-medium">
                      {fav.visitor?.full_name?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-ink">{fav.visitor?.full_name ?? "Unknown"}</p>
                      <p className="text-xs text-ink/40">{fav.visitor?.email}</p>
                    </div>
                  </div>
                </div>
                {fav.label && (
                  <p className="mt-3 text-xs text-ink/50">{fav.label}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <a
                    href={`/dashboard/resident/invitations/new?visitor=${fav.visitor_id}`}
                    className="focus-ring rounded-card bg-ink px-3 py-1.5 text-xs font-medium text-parchment hover:bg-ink-light"
                  >
                    Invite
                  </a>
                  <button
                    onClick={() => setRemoveId(fav.id)}
                    className="focus-ring rounded-card border border-ink/20 px-3 py-1.5 text-xs text-ink hover:border-red-300 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!removeId}
        onClose={() => setRemoveId(null)}
        onConfirm={handleRemove}
        title="Remove Favourite"
        message="Remove this visitor from your favourites? You can always add them back later."
        confirmLabel="Remove"
        variant="danger"
      />
    </DashboardShell>
  );
}
