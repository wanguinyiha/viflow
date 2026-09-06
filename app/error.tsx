"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6 text-center">
      <div className="max-w-md">
        <h1 className="font-display text-4xl italic text-ink">Something went wrong</h1>
        <p className="mt-4 text-sm text-ink/50">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="focus-ring mt-8 inline-block rounded-card bg-ink px-6 py-3 text-sm font-medium text-parchment hover:bg-ink-light"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
