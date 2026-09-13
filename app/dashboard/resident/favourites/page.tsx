"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import FormField, { Input } from "@/components/ui/FormField";
import { showToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/lib/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
  getFavouriteVisitors,
  addFavourite,
  removeFavourite,
  updateFavourite,
  searchVisitors,
} from "@/lib/api/favourites";
import type { FavouriteVisitor } from "@/lib/types";

interface SearchResult {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  id_verified: boolean;
}

export default function FavouritesPage() {
  const { user: profile } = useAuth();
  const [favourites, setFavourites] = useState<FavouriteVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeId, setRemoveId] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Edit state
  const [editFav, setEditFav] = useState<FavouriteVisitor | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!profile) return;
      const { data } = await getFavouriteVisitors(profile.id);
      setFavourites(data);
      setLoading(false);
    }
    load();
  }, [profile]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const { data } = await searchVisitors(query);
    setSearchResults(data as SearchResult[]);
    setSearching(false);
  }, []);

  async function handleAddFavourite(visitor: SearchResult) {
    if (!profile) return;

    // Check if already a favourite
    const alreadyFav = favourites.some((f) => f.visitor_id === visitor.id);
    if (alreadyFav) {
      showToast("Already in your favourites.", "error");
      return;
    }

    const { data, error } = await addFavourite(profile.id, visitor.id, {
      visitorName: visitor.full_name,
      visitorEmail: visitor.email,
      visitorPhone: visitor.phone,
    });

    if (error) {
      showToast("Failed to add favourite: " + error.message, "error");
      return;
    }

    if (data) {
      // Fetch the full favourite with visitor relation
      const { data: full } = await supabase
        .from("favourite_visitors")
        .select("*, visitor:visitor_profiles!favourite_visitors_visitor_id_fkey(id, full_name, email, phone, photo_url)")
        .eq("id", data.id)
        .single();

      if (full) {
        setFavourites((prev) => [full as FavouriteVisitor, ...prev]);
      }
      showToast(`${visitor.full_name} added to favourites.`);
    }

    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  }

  async function handleRemove() {
    if (!removeId) return;
    const { error } = await removeFavourite(removeId);
    if (!error) {
      setFavourites((prev) => prev.filter((f) => f.id !== removeId));
      showToast("Removed from favourites.");
    }
    setRemoveId(null);
  }

  function openEdit(fav: FavouriteVisitor) {
    setEditFav(fav);
    setEditName(fav.visitor_name ?? fav.visitor?.full_name ?? "");
    setEditEmail(fav.visitor_email ?? fav.visitor?.email ?? "");
    setEditPhone(fav.visitor_phone ?? fav.visitor?.phone ?? "");
    setEditLabel(fav.label ?? "");
  }

  async function handleSaveEdit() {
    if (!editFav) return;
    setSaving(true);

    const { error } = await updateFavourite(editFav.id, {
      visitor_name: editName || null,
      visitor_email: editEmail || null,
      visitor_phone: editPhone || null,
      label: editLabel || null,
    });

    if (error) {
      showToast("Failed to update: " + error.message, "error");
      setSaving(false);
      return;
    }

    // Update local state
    setFavourites((prev) =>
      prev.map((f) =>
        f.id === editFav.id
          ? { ...f, visitor_name: editName, visitor_email: editEmail, visitor_phone: editPhone, label: editLabel }
          : f
      )
    );

    showToast("Favourite updated.");
    setEditFav(null);
    setSaving(false);
  }

  // Get display name/email for a favourite (prefer resident's stored version)
  function getDisplayName(fav: FavouriteVisitor) {
    return fav.visitor_name || fav.visitor?.full_name || "Unknown";
  }
  function getDisplayEmail(fav: FavouriteVisitor) {
    return fav.visitor_email || fav.visitor?.email || "";
  }
  function getDisplayPhone(fav: FavouriteVisitor) {
    return fav.visitor_phone || fav.visitor?.phone || null;
  }
  function getDisplayPhoto(fav: FavouriteVisitor) {
    return fav.visitor?.photo_url ?? null;
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
      <PageHeader
        title="Favourite Visitors"
        description="Quick access to your frequent visitors."
        action={
          <button
            onClick={() => setShowSearch(true)}
            className="focus-ring rounded-card bg-ink px-4 py-2 text-sm font-medium text-parchment hover:bg-ink-light"
          >
            Add Favourite
          </button>
        }
      />

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
                      {getDisplayPhoto(fav) ? (
                        <img src={getDisplayPhoto(fav)!} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        getDisplayName(fav).charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-ink">{getDisplayName(fav)}</p>
                      <p className="text-xs text-ink/40">{getDisplayEmail(fav)}</p>
                      {getDisplayPhone(fav) && (
                        <p className="text-xs text-ink/40">{getDisplayPhone(fav)}</p>
                      )}
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
                    onClick={() => openEdit(fav)}
                    className="focus-ring rounded-card border border-ink/20 px-3 py-1.5 text-xs text-ink hover:border-ink/40"
                  >
                    Edit
                  </button>
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

      {/* Search / Add Favourite Modal */}
      <Modal open={showSearch} onClose={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }} title="Add Favourite Visitor">
        <div>
          <FormField label="Search by name or email" htmlFor="visitor-search">
            <Input
              id="visitor-search"
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search visitors…"
              autoFocus
            />
          </FormField>

          {searching && (
            <p className="mt-3 text-sm text-ink/40">Searching…</p>
          )}

          {searchResults.length > 0 && (
            <div className="mt-3 max-h-60 divide-y divide-ink/10 overflow-y-auto rounded-card border border-ink/15">
              {searchResults.map((visitor) => {
                const alreadyFav = favourites.some((f) => f.visitor_id === visitor.id);
                return (
                  <div key={visitor.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-ink/10 text-ink/40 flex items-center justify-center text-xs font-medium">
                        {visitor.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{visitor.full_name}</p>
                        <p className="text-xs text-ink/40">{visitor.email}</p>
                      </div>
                    </div>
                    {alreadyFav ? (
                      <span className="text-xs text-ink/40">Already added</span>
                    ) : (
                      <button
                        onClick={() => handleAddFavourite(visitor)}
                        className="focus-ring rounded-card bg-sage px-3 py-1.5 text-xs font-medium text-parchment hover:bg-sage-dim"
                      >
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
            <p className="mt-3 text-sm text-ink/40">No visitors found.</p>
          )}
        </div>
      </Modal>

      {/* Edit Favourite Modal */}
      <Modal open={!!editFav} onClose={() => setEditFav(null)} title="Edit Favourite">
        {editFav && (
          <div className="space-y-4">
            <FormField label="Name" htmlFor="edit-name">
              <Input id="edit-name" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </FormField>
            <FormField label="Email" htmlFor="edit-email">
              <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </FormField>
            <FormField label="Phone" htmlFor="edit-phone">
              <Input id="edit-phone" type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Optional" />
            </FormField>
            <FormField label="Label" htmlFor="edit-label" helpText="e.g. Mum, Friend, Study buddy">
              <Input id="edit-label" type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="Optional" />
            </FormField>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="focus-ring rounded-card bg-ink px-5 py-2.5 text-sm font-medium text-parchment hover:bg-ink-light disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                onClick={() => setEditFav(null)}
                className="focus-ring rounded-card border border-ink/20 px-5 py-2.5 text-sm text-ink hover:border-ink/40"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

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
