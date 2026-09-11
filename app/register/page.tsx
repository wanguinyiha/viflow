"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MultiStepForm from "@/components/ui/MultiStepForm";
import FormField, { Input, Select } from "@/components/ui/FormField";
import { supabase } from "@/lib/supabaseClient";

function generateRandomPassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

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
          <FormField label="Phone" htmlFor="phone" required>
            <Input
              id="phone"
              type="tel"
              required
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
          <FormField label="ID Type" htmlFor="idType" required>
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
      label: "Vehicle",
      content: (data: Record<string, unknown>, update: (d: Record<string, unknown>) => void) => (
        <div className="space-y-5">
          <h2 className="font-display text-2xl text-ink">Vehicle Information</h2>
          <p className="text-ink/60">If you will be arriving by vehicle, provide the registration details. Write N/A if you do not have a vehicle.</p>
          <FormField label="Registration Number" htmlFor="plate" required helpText="Write N/A if you have no vehicle">
            <Input
              id="plate"
              type="text"
              required
              value={(data.vehiclePlate as string) ?? ""}
              onChange={(e) => update({ vehiclePlate: e.target.value })}
              placeholder="KDA 214B or N/A"
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
              <span className="text-sm font-medium text-ink">{(data.fullName as string) || "\u2014"}</span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <span className="text-sm text-ink/60">Email</span>
              <span className="text-sm font-medium text-ink">{(data.email as string) || "\u2014"}</span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <span className="text-sm text-ink/60">Phone</span>
              <span className="text-sm font-medium text-ink">{(data.phone as string) || "\u2014"}</span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <span className="text-sm text-ink/60">ID Number</span>
              <span className="text-sm font-medium text-ink">{(data.idNumber as string) || "\u2014"}</span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <span className="text-sm text-ink/60">ID Type</span>
              <span className="text-sm font-medium text-ink">
                {(data.idType as string) === "passport"
                  ? "Passport"
                  : (data.idType as string) === "drivers_license"
                  ? "Driver's License"
                  : "National ID"}
              </span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <span className="text-sm text-ink/60">Vehicle</span>
              <span className="text-sm font-medium text-ink">{(data.vehiclePlate as string) || "N/A"}</span>
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
      const fullName = data.fullName as string;
      const phone = data.phone as string;
      const idNumber = data.idNumber as string;
      const idType = data.idType as string;
      const vehiclePlate = (data.vehiclePlate as string) || "N/A";

      // Check if visitor already has a profile by email
      const { data: existingVisitor } = await supabase
        .from("visitor_profiles")
        .select("id, user_id")
        .eq("email", email)
        .single();

      let userId = existingVisitor?.user_id;
      let visitorProfileId = existingVisitor?.id;

      if (!existingVisitor) {
        // Create a new auth account with a generated password (visitor doesn't log in)
        const tempPassword = generateRandomPassword();
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: tempPassword,
          options: {
            data: {
              full_name: fullName,
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

        if (!userId) {
          setError("Failed to create account. Please try again.");
          setSubmitting(false);
          return;
        }

        // Create profile
        const { error: profileInsertError } = await supabase.from("profiles").insert({
          id: userId,
          full_name: fullName,
          email,
          phone: phone || null,
          role: "visitor",
        });

        if (profileInsertError) {
          console.error("Profile insert error:", profileInsertError);
          setError("Failed to create profile: " + profileInsertError.message);
          setSubmitting(false);
          return;
        }

        // Create visitor profile
        const { data: newVisitorProfile, error: visitorProfileError } = await supabase
          .from("visitor_profiles")
          .insert({
            user_id: userId,
            full_name: fullName,
            email,
            phone: phone || null,
            id_number: idNumber || null,
          })
          .select("id")
          .single();

        if (visitorProfileError) {
          console.error("Visitor profile error:", visitorProfileError);
          setError("Failed to create visitor profile: " + visitorProfileError.message);
          setSubmitting(false);
          return;
        }

        visitorProfileId = newVisitorProfile.id;
      } else {
        // Update existing visitor profile with new info
        await supabase
          .from("visitor_profiles")
          .update({
            full_name: fullName,
            phone: phone || null,
            id_number: idNumber || null,
          })
          .eq("id", existingVisitor.id);
      }

      if (!visitorProfileId) {
        setError("Failed to create visitor profile. Please try again.");
        setSubmitting(false);
        return;
      }

      // Add vehicle if provided and not N/A
      if (vehiclePlate && vehiclePlate.toUpperCase() !== "N/A" && visitorProfileId) {
        // Check if vehicle already exists for this visitor
        const { data: existingVehicle } = await supabase
          .from("vehicles")
          .select("id")
          .eq("visitor_id", visitorProfileId)
          .eq("registration_number", vehiclePlate)
          .single();

        if (!existingVehicle) {
          const { error: vehicleError } = await supabase.from("vehicles").insert({
            visitor_id: visitorProfileId,
            registration_number: vehiclePlate,
          });
          if (vehicleError) console.error("Vehicle error:", vehicleError);
        }
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
          const { error: invUpdateError } = await supabase
            .from("invitations")
            .update({
              visitor_id: visitorProfileId,
              visitor_name: fullName,
              status: "accepted",
            })
            .eq("id", invitationId);

          if (invUpdateError) {
            console.error("Invitation update error:", invUpdateError);
          }

          // Create visit record
          const room = invitation.room as { id: string } | null;
          if (room) {
            const { error: visitError } = await supabase.from("visits").insert({
              invitation_id: invitationId,
              visit_code: invitation.visit_code,
              visitor_id: visitorProfileId,
              resident_id: invitation.resident_id,
              room_id: room.id,
              status: "authorized",
            });
            if (visitError) {
              console.error("Visit create error:", visitError);
              setError("Failed to create visit record: " + visitError.message);
              setSubmitting(false);
              return;
            }
          }

          // Add to favourites
          const { error: favError } = await supabase.from("favourite_visitors").insert({
            resident_id: invitation.resident_id,
            visitor_id: visitorProfileId,
          }).select();
          if (favError) console.error("Favourite error:", favError);
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
