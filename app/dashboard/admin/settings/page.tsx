"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import { useAuth } from "@/lib/context/AuthContext";
import { signOut } from "@/lib/auth";

interface SystemInfo {
  totalHostels: number;
  totalRooms: number;
}

function Toggle({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-card border border-ink/10 bg-parchment-dim px-4 py-3">
      <span className="text-sm text-ink">{label}</span>
      <button
        type="button"
        disabled
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed items-center rounded-full transition-colors ${
          enabled ? "bg-sage" : "bg-ink/20"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({ totalHostels: 0, totalRooms: 0 });
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (authLoading || !profile) return;
    async function load() {
      try {
        const res = await fetch("/api/admin/data?type=stats");
        const data = await res.json();
        setSystemInfo({
          totalHostels: data.totalHostels ?? 0,
          totalRooms: data.totalRooms ?? 0,
        });
      } catch {
        /* keep defaults */
      }
      setLoading(false);
    }
    load();
  }, [authLoading, profile]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.push("/login");
    } catch {
      router.push("/login");
    }
  }

  if (authLoading || loading || !profile) {
    return (
      <DashboardShell role="admin" roleLabel="Administrator" personName="Loading...">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" roleLabel="Administrator" personName={profile.full_name}>
      <PageHeader title="Settings" description="System and account settings." />

      <div className="mt-8 max-w-2xl space-y-10">
        {/* System Information */}
        <section>
          <h2 className="font-display text-xl text-ink">System Information</h2>
          <p className="mt-1 text-sm text-ink/50">Read-only overview of the system configuration.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-card border border-ink/15 bg-parchment-dim p-5">
              <p className="font-mono text-2xl text-ink">4</p>
              <p className="mt-1 text-sm text-ink/60">Active Visitor Limit</p>
              <p className="mt-1 text-xs text-ink/40">Enforced by DB trigger</p>
            </div>
            <div className="rounded-card border border-ink/15 bg-parchment-dim p-5">
              <p className="font-mono text-2xl text-ink">{systemInfo.totalHostels}</p>
              <p className="mt-1 text-sm text-ink/60">Hostel Count</p>
            </div>
            <div className="rounded-card border border-ink/15 bg-parchment-dim p-5">
              <p className="font-mono text-2xl text-ink">{systemInfo.totalRooms}</p>
              <p className="mt-1 text-sm text-ink/60">Room Count</p>
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section>
          <h2 className="font-display text-xl text-ink">Notification Settings</h2>
          <p className="mt-1 text-sm text-ink/50">Configure how notifications are sent.</p>
          <div className="mt-4 space-y-3">
            <Toggle label="Email notifications for new invitations" enabled={true} />
            <Toggle label="Email notifications for check-in / check-out" enabled={false} />
            <Toggle label="Alert on flagged activity" enabled={true} />
            <Toggle label="Daily summary digest" enabled={false} />
          </div>
          <p className="mt-3 text-xs text-ink/40 italic">Notification preferences are saved locally and do not yet persist to the server.</p>
        </section>

        {/* Account */}
        <section>
          <h2 className="font-display text-xl text-ink">Account</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-card border border-ink/15 bg-parchment-dim p-5">
              <p className="text-sm text-ink/70">Change your account password.</p>
              <button
                onClick={() => router.push("/reset-password")}
                className="focus-ring mt-4 rounded-card border border-ink/20 px-4 py-2 text-sm text-ink hover:border-ink/40"
              >
                Change Password
              </button>
            </div>

            <div className="rounded-card border border-red-200 bg-red-50/50 p-5">
              <p className="text-sm text-red-800">Sign out of your admin account.</p>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="focus-ring mt-4 rounded-card border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                {signingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
