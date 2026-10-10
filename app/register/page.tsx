"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import FormField, { Input, Select } from "@/components/ui/FormField";
import { supabase } from "@/lib/supabaseClient";

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  idNumber: string;
  idType: string;
  vehiclePlate: string;
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitation");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(!!invitationId);
  const [inviteInfo, setInviteInfo] = useState<{ residentName: string; roomLabel: string } | null>(null);

  const [data, setData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    idNumber: "",
    idType: "national_id",
    vehiclePlate: "",
  });

  // Pre-fill from invitation + favourite + visitor profile data
  useEffect(() => {
    if (!invitationId) return;

    async function load() {
      // Fetch invitation with room and visitor data
      const { data: invitation } = await supabase
        .from("invitations")
        .select("visitor_name, visitor_email, vehicle_registration, visitor_id, resident:profiles!invitations_resident_id_fkey(full_name), room:rooms(room_number, block)")
        .eq("id", invitationId)
        .single();

      if (!invitation) {
        setLoadingInvite(false);
        return;
      }

      const room = invitation.room as { room_number: string; block: string } | null;
      const resident = invitation.resident as { full_name: string } | null;

      setInviteInfo({
        residentName: resident?.full_name ?? "Your host",
        roomLabel: room ? `Block ${room.block} — Room ${room.room_number.replace(/^[AB]-/, "")}` : "",
      });

      let phone = "";
      let idNumber = "";
      let vehiclePlate = invitation.vehicle_registration || "";

      // If visitor has registered before, fetch their profile for id_number and phone
      if (invitation.visitor_id) {
        const { data: visitorProfile } = await supabase
          .from("visitor_profiles")
          .select("id_number, phone")
          .eq("id", invitation.visitor_id)
          .single();

        if (visitorProfile) {
          idNumber = visitorProfile.id_number || "";
          phone = visitorProfile.phone || "";
        }

        // Fetch vehicle registration from vehicles table
        const { data: vehicle } = await supabase
          .from("vehicles")
          .select("registration_number")
          .eq("visitor_id", invitation.visitor_id)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (vehicle?.registration_number && !vehiclePlate) {
          vehiclePlate = vehicle.registration_number;
        }

        // Also check favourite_visitors for phone (resident may have updated it)
        const { data: fav } = await supabase
          .from("favourite_visitors")
          .select("visitor_phone")
          .eq("visitor_id", invitation.visitor_id)
          .maybeSingle();

        if (fav?.visitor_phone) {
          phone = fav.visitor_phone;
        }
      }

      setData((prev) => ({
        ...prev,
        fullName: invitation.visitor_name || prev.fullName,
        email: invitation.visitor_email || prev.email,
        phone: phone || prev.phone,
        idNumber: idNumber || prev.idNumber,
        vehiclePlate: vehiclePlate || prev.vehiclePlate,
      }));

      setLoadingInvite(false);
    }

    load();
  }, [invitationId]);

  function updateField(field: keyof FormData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/visitor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          fullName: data.fullName,
          phone: data.phone,
          idNumber: data.idNumber,
          vehiclePlate: data.vehiclePlate || "N/A",
          invitationId,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        setError(result.error || "Registration failed. Please try again.");
        setSubmitting(false);
        return;
      }

      if (invitationId) {
        router.push(`/pass/${invitationId}`);
      } else {
        router.push("/login");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-parchment">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 26 26" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="24" height="24" rx="3" stroke="#16233B" strokeWidth="1.5" />
              <path d="M6 9.5L13 17L20 6" stroke="#B8863B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display text-xl italic text-ink">ViFlow</span>
          </Link>
          <p className="mt-4 font-mono text-[13px] text-brass-dark">Visitor Registration</p>
          {inviteInfo && (
            <p className="mt-2 text-sm text-ink/50">
              You&apos;ve been invited by <span className="font-medium text-ink">{inviteInfo.residentName}</span>
              {inviteInfo.roomLabel && <> &middot; {inviteInfo.roomLabel}</>}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loadingInvite ? (
          <div className="py-12 text-center">
            <p className="font-mono text-sm text-ink/50">Loading invitation details…</p>
          </div>
        ) : submitting ? (
          <div className="py-12 text-center">
            <p className="font-mono text-sm text-ink/50">Submitting your registration…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Info */}
            <div className="rounded-card border border-ink/15 bg-parchment-dim p-6">
              <h2 className="font-display text-xl text-ink">Personal Information</h2>
              <p className="mt-1 text-sm text-ink/50">Your name, email, and phone number.</p>
              <div className="mt-5 space-y-4">
                <FormField label="Full Name" htmlFor="fullName" required>
                  <Input
                    id="fullName"
                    type="text"
                    required
                    value={data.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="Amara Kimani"
                  />
                </FormField>
                <FormField label="Email" htmlFor="email" required>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={data.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="you@example.com"
                  />
                </FormField>
                <FormField label="Phone" htmlFor="phone" required>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={data.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+254 700 000000"
                  />
                </FormField>
              </div>
            </div>

            {/* Identity */}
            <div className="rounded-card border border-ink/15 bg-parchment-dim p-6">
              <h2 className="font-display text-xl text-ink">Identity</h2>
              <p className="mt-1 text-sm text-ink/50">Your identification details for verification at the gate.</p>
              <div className="mt-5 space-y-4">
                <FormField label="ID Type" htmlFor="idType" required>
                  <Select
                    id="idType"
                    value={data.idType}
                    onChange={(e) => updateField("idType", e.target.value)}
                  >
                    <option value="national_id">National ID</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver&apos;s License</option>
                  </Select>
                </FormField>
                <FormField label="ID Number" htmlFor="idNumber" required>
                  <Input
                    id="idNumber"
                    type="text"
                    required
                    value={data.idNumber}
                    onChange={(e) => updateField("idNumber", e.target.value)}
                    placeholder="National ID or Passport number"
                  />
                </FormField>
              </div>
            </div>

            {/* Vehicle */}
            <div className="rounded-card border border-ink/15 bg-parchment-dim p-6">
              <h2 className="font-display text-xl text-ink">Vehicle</h2>
              <p className="mt-1 text-sm text-ink/50">If you will be arriving by vehicle. Write N/A if you have no vehicle.</p>
              <div className="mt-5">
                <FormField label="Registration Number" htmlFor="plate" required helpText="Write N/A if you have no vehicle">
                  <Input
                    id="plate"
                    type="text"
                    required
                    value={data.vehiclePlate}
                    onChange={(e) => updateField("vehiclePlate", e.target.value)}
                    placeholder="KDA 214B or N/A"
                  />
                </FormField>
              </div>
            </div>

            {/* Review */}
            <div className="rounded-card border border-ink/15 bg-parchment-dim p-6">
              <h2 className="font-display text-xl text-ink">Review</h2>
              <p className="mt-1 text-sm text-ink/50">Confirm your details before submitting.</p>
              <div className="mt-5 space-y-3">
                <div className="flex justify-between border-b border-ink/10 pb-2">
                  <span className="text-sm text-ink/60">Name</span>
                  <span className="text-sm font-medium text-ink">{data.fullName || "—"}</span>
                </div>
                <div className="flex justify-between border-b border-ink/10 pb-2">
                  <span className="text-sm text-ink/60">Email</span>
                  <span className="text-sm font-medium text-ink">{data.email || "—"}</span>
                </div>
                <div className="flex justify-between border-b border-ink/10 pb-2">
                  <span className="text-sm text-ink/60">Phone</span>
                  <span className="text-sm font-medium text-ink">{data.phone || "—"}</span>
                </div>
                <div className="flex justify-between border-b border-ink/10 pb-2">
                  <span className="text-sm text-ink/60">ID Type</span>
                  <span className="text-sm font-medium text-ink">
                    {data.idType === "passport" ? "Passport" : data.idType === "drivers_license" ? "Driver's License" : "National ID"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-ink/10 pb-2">
                  <span className="text-sm text-ink/60">ID Number</span>
                  <span className="text-sm font-medium text-ink">{data.idNumber || "—"}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-sm text-ink/60">Vehicle</span>
                  <span className="text-sm font-medium text-ink">{data.vehiclePlate || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="focus-ring rounded-card bg-ink px-5 py-2.5 text-sm font-medium text-parchment hover:bg-ink-light disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Complete Registration"}
              </button>
              <Link href="/" className="focus-ring rounded-card border border-ink/20 px-5 py-2.5 text-sm text-ink hover:border-ink/40">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <p className="font-mono text-sm text-ink/50">Loading…</p>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
