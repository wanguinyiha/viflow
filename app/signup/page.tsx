"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { signUp } from "@/lib/auth";
import type { UserRole } from "@/lib/auth";

const roles: { id: UserRole; label: string }[] = [
  { id: "visitor", label: "I'm a visitor" },
  { id: "resident", label: "I'm a resident" },
];

export default function Signup() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("resident");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { data, error: signUpError } = await signUp(email, password, fullName, role);

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Redirect to login after successful signup
    router.push("/login");
  }

  return (
    <AuthShell
      eyebrow="Create an account"
      title="Set up your ViFlow profile."
      subtitle="Choose the role that fits you — you can always be invited into another hostel later."
      footer={
        <>
          Already have an account?{" "}
          <a href="/login" className="focus-ring rounded-sm font-medium text-ink underline underline-offset-2">
            Log in
          </a>
        </>
      }
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            className={`focus-ring rounded-full border px-4 py-2 text-sm transition-colors ${
              role === r.id
                ? "border-ink bg-ink text-parchment"
                : "border-ink/20 text-ink/70 hover:border-ink/40"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink/80">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="focus-ring w-full rounded-sm border border-ink/20 bg-parchment px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink/40"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink/80">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="focus-ring w-full rounded-sm border border-ink/20 bg-parchment px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink/40"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink/80">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="focus-ring w-full rounded-sm border border-ink/20 bg-parchment px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink/40"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="focus-ring w-full rounded-card bg-ink px-6 py-3.5 font-body text-[15px] font-medium text-parchment transition-colors hover:bg-ink-light disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
