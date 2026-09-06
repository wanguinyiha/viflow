export default function StatCard({
  label,
  value,
  icon,
  description,
  className = "",
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-card border border-ink/15 bg-parchment-dim px-5 py-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-2xl text-ink">{value}</p>
          <p className="mt-1 text-sm text-ink/60">{label}</p>
        </div>
        {icon && <div className="text-ink/30">{icon}</div>}
      </div>
      {description && <p className="mt-2 text-xs text-ink/40">{description}</p>}
    </div>
  );
}
