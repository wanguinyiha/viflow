const navByRole: Record<string, { label: string; href: string }[]> = {
  visitor: [
    { label: "Overview", href: "/dashboard/visitor" },
    { label: "My profile", href: "/dashboard/visitor" },
    { label: "Invitations", href: "/dashboard/visitor" },
    { label: "My visits", href: "/dashboard/visitor" },
  ],
  resident: [
    { label: "Overview", href: "/dashboard/resident" },
    { label: "Invite a visitor", href: "/dashboard/resident" },
    { label: "Pending authorization", href: "/dashboard/resident" },
    { label: "Visit history", href: "/dashboard/resident" },
  ],
  guard: [
    { label: "Scan a pass", href: "/dashboard/guard" },
    { label: "Today's log", href: "/dashboard/guard" },
    { label: "Open visits", href: "/dashboard/guard" },
  ],
  admin: [
    { label: "Overview", href: "/dashboard/admin" },
    { label: "Residents", href: "/dashboard/admin" },
    { label: "Rooms", href: "/dashboard/admin" },
    { label: "Policies", href: "/dashboard/admin" },
    { label: "Visit records", href: "/dashboard/admin" },
  ],
};

export default function DashboardShell({
  role,
  roleLabel,
  personName,
  children,
}: {
  role: keyof typeof navByRole;
  roleLabel: string;
  personName: string;
  children: React.ReactNode;
}) {
  const items = navByRole[role];

  return (
    <div className="min-h-screen bg-parchment">
      <div className="grid md:grid-cols-[240px_1fr]">
        <aside className="border-b border-ink/10 bg-ink text-parchment md:min-h-screen md:border-b-0 md:border-r md:border-ink/10">
          <div className="px-6 py-6">
            <a href="/" className="flex items-center gap-2 focus-ring w-fit rounded-sm">
              <svg width="22" height="22" viewBox="0 0 26 26" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="24" height="24" rx="3" stroke="#F4EEDF" strokeWidth="1.5" />
                <path d="M6 9.5L13 17L20 6" stroke="#D3A65C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-display text-lg italic">ViFlow</span>
            </a>
          </div>

          <nav className="flex flex-col gap-1 px-4 pb-6">
            {items.map((item, i) => (
              <a
                key={item.label}
                href={item.href}
                className={`focus-ring rounded-sm px-3 py-2 text-[15px] transition-colors ${
                  i === 0 ? "bg-ink-light text-parchment" : "text-parchment/70 hover:bg-ink-light/60"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-auto border-t border-parchment/10 px-6 py-5">
            <p className="font-mono text-[11px] uppercase text-brass-light">{roleLabel}</p>
            <p className="mt-1 text-sm text-parchment/80">{personName}</p>
            <button
              onClick={async () => {
                const { signOut } = await import("@/lib/auth");
                await signOut();
                window.location.href = "/login";
              }}
              className="focus-ring mt-3 inline-block rounded-sm text-sm text-parchment/50 hover:text-parchment/80"
            >
              Log out
            </button>
          </div>
        </aside>

        <div className="px-6 py-10 md:px-12 md:py-14">{children}</div>
      </div>
    </div>
  );
}
