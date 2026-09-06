export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-ink/10 ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-card border border-ink/10 bg-parchment-dim p-6">
      <SkeletonLine className="h-4 w-1/3" />
      <SkeletonLine className="mt-3 h-8 w-1/2" />
      <SkeletonLine className="mt-3 h-3 w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-card border border-ink/10">
      <div className="border-b border-ink/10 bg-parchment-dim px-6 py-3">
        <div className="flex gap-6">
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonLine key={i} className="h-3 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="border-b border-ink/5 px-6 py-4">
          <div className="flex gap-6">
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonLine key={c} className="h-3 flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
