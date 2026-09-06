"use client";

export default function Tabs({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}) {
  return (
    <div className="border-b border-ink/10">
      <nav className="-mb-px flex gap-6" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`focus-ring border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-ink text-ink"
                : "border-transparent text-ink/50 hover:border-ink/20 hover:text-ink/70"
            }`}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-xs text-ink/60">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
