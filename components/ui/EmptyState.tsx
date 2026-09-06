export default function EmptyState({
  title = "Nothing here yet",
  description,
  action,
  icon,
}: {
  title?: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-ink/15 px-6 py-16 text-center">
      {icon && <div className="mb-4 text-ink/20">{icon}</div>}
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-ink/50">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
