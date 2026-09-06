"use client";

import { Input } from "./FormField";

export default function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="w-full sm:w-64">
        <Input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>
      {filters}
    </div>
  );
}
