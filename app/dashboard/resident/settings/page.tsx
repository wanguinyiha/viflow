"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import { showToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/context/AuthContext";

export default function ResidentSettingsPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  // Stop showing the loading state once the profile has resolved.
  const [syncedProfile, setSyncedProfile] = useState(profile);
  if (profile !== syncedProfile) {
    setSyncedProfile(profile);
    if (profile) setLoading(false);
  }

  async function handlePasswordChange() {
    if (!profile?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (!error) showToast("Password reset email sent.");
  }

  if (authLoading || loading || !profile) {
    return (
      <DashboardShell role="resident" roleLabel="Resident" personName="Loading…">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="resident" roleLabel="Resident" personName={profile.full_name}>
          <PageHeader title="Settings" description="Manage your account settings." />

      <div className="mt-8 max-w-lg space-y-8">
        <div>
          <h2 className="font-display text-xl text-ink">Security</h2>
          <div className="mt-4 rounded-card border border-ink/15 bg-parchment-dim p-5">
            <p className="text-sm text-ink/70">Change your password. You will receive a reset link by email.</p>
            <button onClick={handlePasswordChange} className="focus-ring mt-4 rounded-card border border-ink/20 px-4 py-2 text-sm text-ink hover:border-ink/40">
              Change Password
            </button>
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl text-ink">Notifications</h2>
          <div className="mt-4 rounded-card border border-ink/15 bg-parchment-dim p-5 space-y-4">
            {[
              { label: "Invitation sent", description: "When you create a new invitation" },
              { label: "Visitor checked in", description: "When a visitor arrives" },
              { label: "Visitor checked out", description: "When a visitor leaves" },
              { label: "Invitation expired", description: "When an invitation expires unused" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{item.label}</p>
                  <p className="text-xs text-ink/40">{item.description}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" defaultChecked className="peer sr-only" />
                  <div className="h-5 w-9 rounded-full bg-ink/20 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-parchment after:transition-all peer-checked:bg-sage peer-checked:after:translate-x-full" />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl text-ink">Account</h2>
          <div className="mt-4 rounded-card border border-ink/15 bg-parchment-dim p-5">
            <p className="text-sm text-ink/70">Sign out of your account on this device.</p>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="focus-ring mt-4 rounded-card border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
