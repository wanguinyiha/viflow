"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { signIn } from "@/lib/auth";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { data, error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Fetch profile to determine role for redirect
    const { supabase } = await import("@/lib/supabaseClient");
    const userId = data.user?.id;
    if (!userId) {
      setError("Login failed. Please try again.");
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    const role = (profile?.role as string) ?? "visitor";
    router.push(`/dashboard/${role}`);
  }

  return (
    <AuthShell
      eyebrow="Log in"
      title="Good to see you again."
      subtitle="Visitors, residents, guards and administrators all sign in here."
      footer={
        <>
          New to ViFlow?{" "}
          <a href="/signup" className="focus-ring rounded-sm font-medium text-ink underline underline-offset-2">
            Create an account
          </a>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
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
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-ink/80">
              Password
            </label>
            <a href="#" className="focus-ring rounded-sm text-sm text-ink/50 hover:text-ink/80">
              Forgot?
            </a>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="focus-ring w-full rounded-sm border border-ink/20 bg-parchment px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink/40"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="focus-ring w-full rounded-card bg-ink px-6 py-3.5 font-body text-[15px] font-medium text-parchment transition-colors hover:bg-ink-light disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
