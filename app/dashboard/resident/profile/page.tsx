"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import FormField, { Input } from "@/components/ui/FormField";
import { showToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/context/AuthContext";

export default function ResidentProfilePage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone ?? "");
      setLoading(false);
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", profile.id);
    setSaving(false);
    showToast("Profile updated.");
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
          <PageHeader title="Profile" description="Manage your account information." />

      <div className="mt-8 max-w-lg">
        <form onSubmit={handleSave} className="space-y-5">
          <FormField label="Full Name" htmlFor="name" required>
            <Input id="name" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </FormField>
          <FormField label="Email" htmlFor="email">
            <Input id="email" type="email" value={profile.email} disabled className="opacity-60" />
            <p className="mt-1 text-xs text-ink/40">Email cannot be changed.</p>
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 700 000000" />
          </FormField>
          <FormField label="Role" htmlFor="role">
            <Input id="role" type="text" value="Resident" disabled className="opacity-60 capitalize" />
          </FormField>
          <button type="submit" disabled={saving} className="focus-ring rounded-card bg-ink px-5 py-2.5 text-sm font-medium text-parchment hover:bg-ink-light disabled:opacity-60">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}
