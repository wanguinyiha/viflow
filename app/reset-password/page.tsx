"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { updatePassword } from "@/lib/api/auth";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [hasHash, setHasHash] = useState(false);

  useEffect(() => {
    // Supabase password reset redirects with a hash fragment containing the access token
    setHasHash(window.location.hash.includes("access_token"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await updatePassword(password);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/login"), 3000);
  }

  return (
    <AuthShell
      eyebrow="Set new password"
      title="Create a new password."
      subtitle="Your password should be at least 6 characters long."
      footer={
        <>
          <a href="/login" className="focus-ring rounded-sm font-medium text-ink underline underline-offset-2">
            Back to login
          </a>
        </>
      }
    >
      {!hasHash ? (
        <div className="rounded-card border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <p className="font-medium">Invalid reset link</p>
          <p className="mt-1">
            This password reset link is invalid or has expired.
            Please request a new one.
          </p>
          <a href="/forgot-password" className="mt-3 inline-block font-medium text-ink underline underline-offset-2">
            Request new link
          </a>
        </div>
      ) : success ? (
        <div className="rounded-card border border-sage bg-sage/5 px-5 py-4 text-sm text-sage-dim">
          <p className="font-medium">Password updated</p>
          <p className="mt-1">
            Your password has been updated. Redirecting to login…
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
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink/80">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus-ring w-full rounded-sm border border-ink/20 bg-parchment px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink/40"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-ink/80">
              Confirm new password
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="focus-ring w-full rounded-sm border border-ink/20 bg-parchment px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink/40"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="focus-ring w-full rounded-card bg-ink px-6 py-3.5 font-body text-[15px] font-medium text-parchment transition-colors hover:bg-ink-light disabled:opacity-60"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
