"use client";

import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/context/AuthContext";

export default function ActivityReviewPage() {
  const { user: profile, loading: authLoading } = useAuth();

  if (authLoading || !profile) {
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
