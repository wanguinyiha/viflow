import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6 text-center">
      <div className="max-w-md">
        <h1 className="font-display text-6xl italic text-ink">403</h1>
        <p className="mt-4 font-display text-xl text-ink">Access Denied</p>
        <p className="mt-2 text-sm text-ink/50">You don&apos;t have permission to view this page.</p>
        <Link
          href="/"
          className="focus-ring mt-8 inline-block rounded-card bg-ink px-6 py-3 text-sm font-medium text-parchment hover:bg-ink-light"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
