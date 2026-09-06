"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

export default function ActivityReviewPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !profile) {
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
        <EmptyState
          title="No flagged activity"
          description="No unusual visitor activity has been detected. This page will surface visitors with frequent or unusual patterns for review."
        />
      </div>
    </DashboardShell>
  );
}
