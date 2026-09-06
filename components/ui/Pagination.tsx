export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="focus-ring rounded-sm px-2 py-1 text-sm text-ink/60 hover:text-ink disabled:opacity-30"
        aria-label="Previous page"
      >
        &larr;
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-sm text-ink/40">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`focus-ring rounded-sm px-3 py-1 text-sm ${
              p === page
                ? "bg-ink font-medium text-parchment"
                : "text-ink/60 hover:text-ink"
            }`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="focus-ring rounded-sm px-2 py-1 text-sm text-ink/60 hover:text-ink disabled:opacity-30"
        aria-label="Next page"
      >
        &rarr;
      </button>
    </nav>
  );
}
