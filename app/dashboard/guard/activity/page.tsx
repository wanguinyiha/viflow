"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/context/AuthContext";

interface ActivityReview {
  id: string;
  visitor_id: string;
  reason: string;
  status: string;
  flagged_at: string;
  visitor: { full_name: string; email: string } | null;
}

export default function ActivityReviewPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<ActivityReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !profile) return;

    async function load() {
      const { data } = await supabase
        .from("activity_reviews")
        .select("*, visitor:visitor_profiles(full_name, email)")
        .order("flagged_at", { ascending: false })
        .limit(50);

      setReviews((data ?? []) as ActivityReview[]);
      setLoading(false);
    }
    load();
  }, [authLoading, profile]);

  if (authLoading || loading || !profile) {
    return (
      <DashboardShell role="guard" roleLabel="Guard" personName="Loading…">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="guard" roleLabel="Guard" personName={profile.full_name}>
      <PageHeader title="Activity Review" description="Review unusual or frequent visitor activity." />

      <div className="mt-8">
        {reviews.length === 0 ? (
          <EmptyState
            title="No flagged activity"
            description="No unusual visitor activity has been detected."
          />
        ) : (
          <div className="overflow-hidden rounded-card border border-ink/15">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/15 bg-parchment-dim text-sm text-ink/60">
                  <th className="px-4 py-3 font-medium">Visitor</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id} className="border-b border-ink/5 last:border-b-0">
                    <td className="px-4 py-3">
                      <p className="text-[15px] text-ink">{r.visitor?.full_name ?? "—"}</p>
                      <p className="text-xs text-ink/50">{r.visitor?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink/70">{r.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs uppercase ${
                        r.status === "pending" ? "border-amber-200 bg-amber-50 text-amber-700" :
                        r.status === "resolved" ? "border-sage/20 bg-sage/10 text-sage-dim" :
                        "border-red-200 bg-red-50 text-red-700"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-ink/70">
                      {new Date(r.flagged_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
