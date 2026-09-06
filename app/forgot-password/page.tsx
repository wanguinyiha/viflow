"use client";

import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { resetPassword } from "@/lib/api/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: resetError } = await resetPassword(email);

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <AuthShell
      eyebrow="Reset your password"
      title="Forgot your password?"
      subtitle="Enter your email and we will send you a link to reset your password."
      footer={
        <>
          Remember your password?{" "}
          <a href="/login" className="focus-ring rounded-sm font-medium text-ink underline underline-offset-2">
            Log in
          </a>
        </>
      }
    >
      {sent ? (
        <div className="rounded-card border border-sage bg-sage/5 px-5 py-4 text-sm text-sage-dim">
          <p className="font-medium">Check your email</p>
          <p className="mt-1">
            We sent a password reset link to <strong>{email}</strong>.
            Check your inbox and follow the instructions.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink/80">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus-ring w-full rounded-sm border border-ink/20 bg-parchment px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink/40"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="focus-ring w-full rounded-card bg-ink px-6 py-3.5 font-body text-[15px] font-medium text-parchment transition-colors hover:bg-ink-light disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
