"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import SlideOver from "@/components/ui/SlideOver";
import { useAuth } from "@/lib/context/AuthContext";
import type { VisitorProfile } from "@/lib/types";

async function fetchVisitorRows(): Promise<VisitorProfile[]> {
  try {
    const res = await fetch("/api/admin/data?type=visitors");
    const data = await res.json();
    return data.visitors ?? [];
  } catch {
    return [];
  }
}


export default function AdminVisitorsPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [visitors, setVisitors] = useState<VisitorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // View slide-over
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorProfile | null>(null);

  useEffect(() => {
    if (authLoading || !profile) return;
    async function fetchInitialVisitors() {
      setVisitors(await fetchVisitorRows());
      setLoading(false);
    }
    fetchInitialVisitors();
  }, [authLoading, profile]);


  const filtered = visitors.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.full_name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q);
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
      <div>
        <h1 className="font-display text-3xl italic text-ink">Visitors</h1>
        <p className="mt-1 text-sm text-ink/50">View all registered visitors.</p>
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
              <th className="px-4 py-3 font-medium text-ink/70">ID Verified</th>
              <th className="px-4 py-3 font-medium text-ink/70">Photo Verified</th>
              <th className="px-4 py-3 font-medium text-ink/70">Registered</th>
              <th className="px-4 py-3 font-medium text-ink/70 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-parchment-dim/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/10 text-xs font-medium text-ink">
                      {v.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-ink">{v.full_name}</p>
                      <p className="text-xs text-ink/50">{v.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink/60">{v.phone || "\u2014"}</td>
                <td className="px-4 py-3">
                  {v.id_verified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-ink/40">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Not Verified
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {v.photo_verified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-ink/40">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Not Verified
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink/50">{new Date(v.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelectedVisitor(v)}
                    className="text-xs text-ink/50 hover:text-ink"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/40">
                  No visitors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Visitor Detail SlideOver */}
      <SlideOver open={!!selectedVisitor} onClose={() => setSelectedVisitor(null)} title="Visitor Details">
        {selectedVisitor && (
          <div className="space-y-6">
            {/* Photo & Name */}
            <div className="flex items-center gap-4">
              {selectedVisitor.photo_url ? (
                <img
                  src={selectedVisitor.photo_url}
                  alt={selectedVisitor.full_name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink/10 text-2xl font-medium text-ink">
                  {selectedVisitor.full_name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-display text-lg text-ink">{selectedVisitor.full_name}</p>
                <p className="text-sm text-ink/50">{selectedVisitor.email}</p>
              </div>
            </div>

            {/* Profile Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-ink/50">Phone</span>
                <p className="font-medium text-ink">{selectedVisitor.phone || "\u2014"}</p>
              </div>
              <div>
                <span className="text-ink/50">ID Number</span>
                <p className="font-medium text-ink">{selectedVisitor.id_number || "\u2014"}</p>
              </div>
              <div>
                <span className="text-ink/50">Registered</span>
                <p className="font-medium text-ink">{new Date(selectedVisitor.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Verification Status */}
            <div className="border-t border-ink/10 pt-4">
              <h3 className="font-display text-lg text-ink mb-3">Verification Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-card border border-ink/10 bg-parchment-dim/50 p-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-ink/50" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 4h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                      <circle cx="10" cy="10" r="3" />
                    </svg>
                    <span className="text-sm font-medium text-ink">ID Document</span>
                  </div>
                  {selectedVisitor.id_verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink/10 px-2 py-0.5 text-xs font-medium text-ink/50">
                      Pending
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-card border border-ink/10 bg-parchment-dim/50 p-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-ink/50" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M10 3a4 4 0 100 8 4 4 0 000-8zM2 17.5C2 14.5 5.5 13 10 13s8 1.5 8 4.5" />
                    </svg>
                    <span className="text-sm font-medium text-ink">Photo</span>
                  </div>
                  {selectedVisitor.photo_verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink/10 px-2 py-0.5 text-xs font-medium text-ink/50">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ID Document */}
            {selectedVisitor.id_document_url && (
              <div className="border-t border-ink/10 pt-4">
                <h3 className="font-display text-lg text-ink mb-3">ID Document</h3>
                <a
                  href={selectedVisitor.id_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-card border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                  View Document
                </a>
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </DashboardShell>
  );
}
