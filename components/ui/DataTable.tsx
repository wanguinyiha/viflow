"use client";

import { useMemo, useState } from "react";
import Pagination from "./Pagination";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  pageSize = 10,
  search,
  onRowClick,
  emptyMessage = "No records found.",
}: {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  search?: string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((v) =>
        v !== null && v !== undefined && String(v).toLowerCase().includes(q)
      )
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey as keyof T] ?? "";
      const bVal = b[sortKey as keyof T] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="overflow-hidden rounded-card border border-ink/15">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-ink/15 bg-parchment-dim text-sm text-ink/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium ${col.className ?? ""} ${
                    col.sortable ? "cursor-pointer select-none hover:text-ink" : ""
                  }`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <span className="text-ink/40">{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-ink/40">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-ink/5 last:border-b-0 ${
                    onRowClick ? "cursor-pointer hover:bg-parchment-dim/50" : ""
                  } ${i !== paged.length - 1 ? "border-b border-ink/10" : ""}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-[15px] ${col.className ?? ""}`}>
                      {col.render
                        ? col.render(row)
                        : String((row[col.key as keyof T] as React.ReactNode) ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="border-t border-ink/10 bg-parchment-dim px-4 py-3">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
