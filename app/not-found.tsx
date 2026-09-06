export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6 text-center">
      <div className="max-w-md">
        <h1 className="font-display text-6xl italic text-ink">404</h1>
        <p className="mt-4 font-display text-xl text-ink">Page Not Found</p>
        <p className="mt-2 text-sm text-ink/50">The page you&apos;re looking for doesn&apos;t exist.</p>
        <a
          href="/"
          className="focus-ring mt-8 inline-block rounded-card bg-ink px-6 py-3 text-sm font-medium text-parchment hover:bg-ink-light"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
