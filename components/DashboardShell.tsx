"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const navByRole: Record<string, { label: string; href: string; icon?: string }[]> = {
  visitor: [
    { label: "Overview", href: "/dashboard/visitor" },
    { label: "My Profile", href: "/dashboard/visitor/profile" },
    { label: "Invitations", href: "/dashboard/visitor/invitations" },
    { label: "My Visits", href: "/dashboard/visitor/visits" },
  ],
  resident: [
    { label: "Dashboard", href: "/dashboard/resident" },
    { label: "Create Invitation", href: "/dashboard/resident/invitations/new" },
    { label: "My Visitors", href: "/dashboard/resident/visitors" },
    { label: "Favourite Visitors", href: "/dashboard/resident/favourites" },
    { label: "Invitations", href: "/dashboard/resident/invitations" },
    { label: "Active Visits", href: "/dashboard/resident/active" },
    { label: "Visit History", href: "/dashboard/resident/history" },
    { label: "Profile", href: "/dashboard/resident/profile" },
    { label: "Settings", href: "/dashboard/resident/settings" },
  ],
  guard: [
    { label: "Dashboard", href: "/dashboard/guard" },
    { label: "Verify Visitor", href: "/dashboard/guard/verify" },
    { label: "Active Visitors", href: "/dashboard/guard/active" },
    { label: "Visit Log", href: "/dashboard/guard/log" },
    { label: "Activity Review", href: "/dashboard/guard/activity" },
    { label: "Profile", href: "/dashboard/guard/profile" },
    { label: "Settings", href: "/dashboard/guard/settings" },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard/admin" },
    { label: "Users", href: "/dashboard/admin/users" },
    { label: "Residents", href: "/dashboard/admin/residents" },
    { label: "Visitors", href: "/dashboard/admin/visitors" },
    { label: "Guards", href: "/dashboard/admin/guards" },
    { label: "Hostels", href: "/dashboard/admin/hostels" },
    { label: "Rooms", href: "/dashboard/admin/rooms" },
    { label: "Invitations", href: "/dashboard/admin/invitations" },
    { label: "Visits", href: "/dashboard/admin/visits" },
    { label: "Verifications", href: "/dashboard/admin/verifications" },
    { label: "Activity Review", href: "/dashboard/admin/activity" },
    { label: "Audit Logs", href: "/dashboard/admin/audit" },
    { label: "Reports", href: "/dashboard/admin/reports" },
    { label: "Settings", href: "/dashboard/admin/settings" },
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
  const pathname = usePathname();
  const items = navByRole[role];
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === `/dashboard/${role}`) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-parchment">
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-ink/10 bg-ink px-4 py-3 text-parchment md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="focus-ring rounded-sm p-1"
          aria-label="Open menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 7h18M3 12h18M3 17h18" />
          </svg>
        </button>
        <a href="/" className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="24" height="24" rx="3" stroke="#F4EEDF" strokeWidth="1.5" />
            <path d="M6 9.5L13 17L20 6" stroke="#D3A65C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-display text-lg italic">ViFlow</span>
        </a>
        <div className="w-8" />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="grid md:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col border-r border-ink/10 bg-ink text-parchment transition-transform duration-200 md:static md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-6 py-6">
            <a href="/" className="flex items-center gap-2 focus-ring w-fit rounded-sm">
              <svg width="22" height="22" viewBox="0 0 26 26" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="24" height="24" rx="3" stroke="#F4EEDF" strokeWidth="1.5" />
                <path d="M6 9.5L13 17L20 6" stroke="#D3A65C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-display text-lg italic">ViFlow</span>
            </a>
            <button
              onClick={() => setSidebarOpen(false)}
              className="focus-ring rounded-sm p-1 text-parchment/50 hover:text-parchment md:hidden"
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 pb-6">
            {items.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`focus-ring rounded-sm px-3 py-2 text-[15px] transition-colors ${
                  isActive(item.href)
                    ? "bg-ink-light text-parchment"
                    : "text-parchment/70 hover:bg-ink-light/60"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="border-t border-parchment/10 px-6 py-5">
            <p className="font-mono text-[11px] uppercase text-brass-light">{roleLabel}</p>
            <p className="mt-1 truncate text-sm text-parchment/80">{personName}</p>
            <button
              onClick={async () => {
                const { signOut } = await import("@/lib/api/auth");
                await signOut();
                window.location.href = "/login";
              }}
              className="focus-ring mt-3 inline-block rounded-sm text-sm text-parchment/50 hover:text-parchment/80"
            >
              Log out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="min-h-screen">
          {/* Top header bar */}
          <header className="hidden border-b border-ink/10 bg-parchment-dim/50 px-6 py-3 md:block">
            <div className="flex items-center justify-between">
              <div />
              <div className="flex items-center gap-4">
                <button className="focus-ring relative rounded-sm p-1 text-ink/40 hover:text-ink" aria-label="Notifications">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10 2a5 5 0 00-5 5v3l-1.3 2.6a.5.5 0 00.45.7h11.7a.5.5 0 00.45-.7L15 10V7a5 5 0 00-5-5z" />
                    <path d="M8 14a2 2 0 004 0" />
                  </svg>
                </button>
                <div className="text-right">
                  <p className="text-sm font-medium text-ink">{personName}</p>
                  <p className="text-xs text-ink/50 capitalize">{roleLabel}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="px-6 py-10 md:px-12 md:py-14">{children}</div>
        </div>
      </div>
    </div>
  );
}
