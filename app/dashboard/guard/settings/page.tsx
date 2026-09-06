"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

export default function GuardSettingsPage() {
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
      <PageHeader title="Settings" description="Manage your account settings." />

      <div className="mt-8 max-w-lg space-y-8">
        <div>
          <h2 className="font-display text-xl text-ink">Security</h2>
          <div className="mt-4 rounded-card border border-ink/15 bg-parchment-dim p-5">
            <p className="text-sm text-ink/70">Change your password.</p>
            <button
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.email) {
                  await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/reset-password` });
                }
              }}
              className="focus-ring mt-4 rounded-card border border-ink/20 px-4 py-2 text-sm text-ink hover:border-ink/40"
            >
              Change Password
            </button>
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl text-ink">Account</h2>
          <div className="mt-4 rounded-card border border-ink/15 bg-parchment-dim p-5">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="focus-ring rounded-card border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
