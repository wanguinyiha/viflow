"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MultiStepForm from "@/components/ui/MultiStepForm";
import FormField, { Input, Select } from "@/components/ui/FormField";
import { supabase } from "@/lib/supabaseClient";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitation");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const steps = [
    {
      label: "Personal Info",
      content: (data: Record<string, unknown>, update: (d: Record<string, unknown>) => void) => (
        <div className="space-y-5">
          <h2 className="font-display text-2xl text-ink">Personal Information</h2>
          <p className="text-ink/60">Tell us about yourself. This information will be used for visitor verification.</p>
          <FormField label="Full Name" htmlFor="fullName" required>
            <Input
              id="fullName"
              type="text"
              required
              value={(data.fullName as string) ?? ""}
              onChange={(e) => update({ fullName: e.target.value })}
              placeholder="Amara Kimani"
            />
          </FormField>
          <FormField label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              required
              value={(data.email as string) ?? ""}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="you@example.com"
            />
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <Input
              id="phone"
              type="tel"
              value={(data.phone as string) ?? ""}
              onChange={(e) => update({ phone: e.target.value })}
              placeholder="+254 700 000000"
            />
          </FormField>
        </div>
      ),
    },
    {
      label: "Identity",
      content: (data: Record<string, unknown>, update: (d: Record<string, unknown>) => void) => (
        <div className="space-y-5">
          <h2 className="font-display text-2xl text-ink">Identity Information</h2>
          <p className="text-ink/60">Provide your identification details for verification at the gate.</p>
          <FormField label="ID Number" htmlFor="idNumber" required>
            <Input
              id="idNumber"
              type="text"
              required
              value={(data.idNumber as string) ?? ""}
              onChange={(e) => update({ idNumber: e.target.value })}
              placeholder="National ID or Passport number"
            />
          </FormField>
          <FormField label="ID Type" htmlFor="idType">
            <Select
              id="idType"
              value={(data.idType as string) ?? "national_id"}
              onChange={(e) => update({ idType: e.target.value })}
            >
              <option value="national_id">National ID</option>
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver&apos;s License</option>
            </Select>
          </FormField>
        </div>
      ),
    },
    {
      label: "Photo",
      content: (data: Record<string, unknown>, update: (d: Record<string, unknown>) => void) => (
        <div className="space-y-5">
          <h2 className="font-display text-2xl text-ink">Profile Photo</h2>
          <p className="text-ink/60">Upload a clear photo of yourself. This will be used for visual verification at the gate.</p>
          <FormField label="Profile Photo" htmlFor="photo" helpText="JPEG or PNG, maximum 5MB">
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) update({ photoFile: file });
              }}
              className="file:mr-4 file:rounded-sm file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:text-parchment"
            />
          </FormField>
          {data.photoFile instanceof File && (
            <p className="text-sm text-sage-dim">Photo selected: {data.photoFile.name}</p>
          )}
        </div>
      ),
    },
    {
      label: "Vehicle",
      content: (data: Record<string, unknown>, update: (d: Record<string, unknown>) => void) => (
        <div className="space-y-5">
          <h2 className="font-display text-2xl text-ink">Vehicle Information</h2>
          <p className="text-ink/60">If you will be arriving by vehicle, provide the registration details. You can skip this step.</p>
          <FormField label="Registration Number" htmlFor="plate">
            <Input
              id="plate"
              type="text"
              value={(data.vehiclePlate as string) ?? ""}
              onChange={(e) => update({ vehiclePlate: e.target.value })}
              placeholder="KDA 214B"
            />
          </FormField>
        </div>
      ),
    },
    {
      label: "Review",
      content: (data: Record<string, unknown>) => (
        <div className="space-y-5">
          <h2 className="font-display text-2xl text-ink">Review Your Information</h2>
          <p className="text-ink/60">Please confirm the details below before submitting.</p>
          <div className="rounded-card border border-ink/15 bg-parchment p-5 space-y-3">
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <span className="text-sm text-ink/60">Name</span>
              <span className="text-sm font-medium text-ink">{(data.fullName as string) || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <span className="text-sm text-ink/60">Email</span>
              <span className="text-sm font-medium text-ink">{(data.email as string) || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <span className="text-sm text-ink/60">Phone</span>
              <span className="text-sm font-medium text-ink">{(data.phone as string) || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <span className="text-sm text-ink/60">ID Number</span>
              <span className="text-sm font-medium text-ink">{(data.idNumber as string) || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <span className="text-sm text-ink/60">Vehicle</span>
              <span className="text-sm font-medium text-ink">{(data.vehiclePlate as string) || "None"}</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  async function handleSubmit(data: Record<string, unknown>) {
    setSubmitting(true);
    setError("");

    try {
      const email = data.email as string;

      // Check if visitor already has an account
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      let userId = existingProfile?.id;

      if (!existingProfile) {
        // Create new account with a random password
        const tempPassword = "visitor-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: tempPassword,
          options: {
            data: {
              full_name: data.fullName,
              role: "visitor",
            },
          },
        });

        if (authError) {
          setError(authError.message);
          setSubmitting(false);
          return;
        }

        userId = authData.user?.id;

        // Manually create profile (triggers removed)
        if (userId) {
          await supabase.from("profiles").upsert({
            id: userId,
            full_name: data.fullName as string,
            email,
            role: "visitor",
          }, { onConflict: "id" });
        }
      }

      if (!userId) {
        setError("Failed to create account. Please try again.");
        setSubmitting(false);
        return;
      }

      // Upsert visitor profile
      const visitorProfileData: Record<string, unknown> = {
        user_id: userId,
        full_name: data.fullName,
        email,
        phone: data.phone || null,
        id_number: data.idNumber || null,
        vehicle_plate: data.vehiclePlate || null,
      };

      // Upload photo if provided
      if (data.photoFile instanceof File) {
        const fileExt = data.photoFile.name.split(".").pop();
        const filePath = `visitor-photos/${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("visitor-photos")
          .upload(filePath, data.photoFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("visitor-photos")
            .getPublicUrl(filePath);
          visitorProfileData.photo_url = urlData.publicUrl;
        }
      }

      const { error: profileError } = await supabase
        .from("visitor_profiles")
        .upsert(visitorProfileData, { onConflict: "user_id" });

      if (profileError) {
        console.error("Profile error:", profileError);
      }

      // Update invitation if exists
      if (invitationId) {
        const { data: invitation } = await supabase
          .from("invitations")
          .select("*, room:rooms(id)")
          .eq("id", invitationId)
          .single();

        if (invitation) {
          // Update invitation with visitor info
          await supabase
            .from("invitations")
            .update({
              visitor_id: userId,
              visitor_name: data.fullName as string,
              status: "accepted",
            })
            .eq("id", invitationId);

          // Create visit record
          const room = invitation.room as { id: string } | null;
          if (room) {
            await supabase.from("visits").insert({
              invitation_id: invitationId,
              visitor_id: userId,
              resident_id: invitation.resident_id,
              room_id: room.id,
              status: "authorized",
            });
          }

          // Add to favourites if not already there
          await supabase.from("favourite_visitors").upsert({
            resident_id: invitation.resident_id,
            visitor_id: userId,
          }, { onConflict: "resident_id,visitor_id" });
        }
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
          <a href="/" className="inline-flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 26 26" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="24" height="24" rx="3" stroke="#16233B" strokeWidth="1.5" />
              <path d="M6 9.5L13 17L20 6" stroke="#B8863B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display text-xl italic text-ink">ViFlow</span>
          </a>
          <p className="mt-4 font-mono text-[13px] text-brass-dark">Visitor Registration</p>
        </div>

        {error && (
          <div className="mb-6 rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {submitting ? (
          <div className="py-12 text-center">
            <p className="font-mono text-sm text-ink/50">Submitting your registration…</p>
          </div>
        ) : (
          <MultiStepForm steps={steps} onComplete={handleSubmit} />
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
