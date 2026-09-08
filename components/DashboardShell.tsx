"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

type NavItem = { label: string; href: string };
type NavGroup = { type: "group"; label: string; items: NavItem[] };
type NavSingle = { type: "single"; label: string; href: string };
type NavEntry = NavSingle | NavGroup;

const navByRole: Record<string, NavEntry[]> = {
  visitor: [
    { type: "single", label: "Overview", href: "/dashboard/visitor" },
    { type: "single", label: "My Profile", href: "/dashboard/visitor/profile" },
    { type: "single", label: "Invitations", href: "/dashboard/visitor/invitations" },
    { type: "single", label: "My Visits", href: "/dashboard/visitor/visits" },
  ],
  resident: [
    { type: "single", label: "Dashboard", href: "/dashboard/resident" },
    { type: "single", label: "Create Invitation", href: "/dashboard/resident/invitations/new" },
    { type: "single", label: "My Visitors", href: "/dashboard/resident/visitors" },
    { type: "single", label: "Favourite Visitors", href: "/dashboard/resident/favourites" },
    { type: "single", label: "Invitations", href: "/dashboard/resident/invitations" },
    { type: "single", label: "Active Visits", href: "/dashboard/resident/active" },
    { type: "single", label: "Visit History", href: "/dashboard/resident/history" },
    { type: "single", label: "Profile", href: "/dashboard/resident/profile" },
    { type: "single", label: "Settings", href: "/dashboard/resident/settings" },
  ],
  guard: [
    { type: "single", label: "Dashboard", href: "/dashboard/guard" },
    { type: "single", label: "Verify Visitor", href: "/dashboard/guard/verify" },
    { type: "single", label: "Active Visitors", href: "/dashboard/guard/active" },
    { type: "single", label: "Visit Log", href: "/dashboard/guard/log" },
    { type: "single", label: "Activity Review", href: "/dashboard/guard/activity" },
    { type: "single", label: "Profile", href: "/dashboard/guard/profile" },
    { type: "single", label: "Settings", href: "/dashboard/guard/settings" },
  ],
  admin: [
    { type: "single", label: "Dashboard", href: "/dashboard/admin" },
    {
      type: "group",
      label: "People",
      items: [
        { label: "Users", href: "/dashboard/admin/users" },
        { label: "Residents", href: "/dashboard/admin/residents" },
        { label: "Visitors", href: "/dashboard/admin/visitors" },
        { label: "Guards", href: "/dashboard/admin/guards" },
      ],
    },
    { type: "single", label: "Rooms", href: "/dashboard/admin/rooms" },
    {
      type: "group",
      label: "Access",
      items: [
        { label: "Invitations", href: "/dashboard/admin/invitations" },
        { label: "Visits", href: "/dashboard/admin/visits" },
        { label: "Verifications", href: "/dashboard/admin/verifications" },
        { label: "Vehicles", href: "/dashboard/admin/vehicles" },
      ],
    },
    {
      type: "group",
      label: "Security",
      items: [
        { label: "Activity Review", href: "/dashboard/admin/activity" },
        { label: "Audit Logs", href: "/dashboard/admin/audit" },
      ],
    },
    { type: "single", label: "Reports", href: "/dashboard/admin/reports" },
    { type: "single", label: "Settings", href: "/dashboard/admin/settings" },
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Auto-expand groups that contain the active page
  useEffect(() => {
    const newExpanded: Record<string, boolean> = {};
    items.forEach((item) => {
      if (item.type === "group") {
        const hasActive = item.items.some((child) => pathname.startsWith(child.href));
        if (hasActive) newExpanded[item.label] = true;
      }
    });
    setExpandedGroups((prev) => ({ ...prev, ...newExpanded }));
  }, [pathname, items]);

  function toggleGroup(label: string) {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function isActive(href: string) {
    if (href === `/dashboard/${role}`) return pathname === href;
    return pathname.startsWith(href);
  }

  function renderItem(entry: NavEntry, depth = 0) {
    if (entry.type === "single") {
      return (
        <a
          key={entry.label}
          href={entry.href}
          className={`focus-ring rounded-sm px-3 py-2 text-[15px] transition-colors ${
            depth > 0 ? "pl-6 text-[14px]" : ""
          } ${
            isActive(entry.href)
              ? "bg-ink-light text-parchment"
              : "text-parchment/70 hover:bg-ink-light/60"
          }`}
        >
          {entry.label}
        </a>
      );
    }

    // Group
    const isExpanded = expandedGroups[entry.label] ?? false;
    const hasActiveChild = entry.items.some((child) => pathname.startsWith(child.href));

    return (
      <div key={entry.label}>
        <button
          onClick={() => toggleGroup(entry.label)}
          className={`focus-ring flex w-full items-center justify-between rounded-sm px-3 py-2 text-[15px] transition-colors ${
            hasActiveChild && !isExpanded
              ? "text-parchment"
              : "text-parchment/50 hover:text-parchment/70"
          }`}
        >
          <span className="font-medium uppercase tracking-wider text-[11px]">{entry.label}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
          >
            <path d="M4 2l4 4-4 4" />
          </svg>
        </button>
        {isExpanded && (
          <div className="ml-1 mt-0.5 space-y-0.5">
            {entry.items.map((child) => (
              <a
                key={child.href}
                href={child.href}
                className={`focus-ring block rounded-sm px-3 py-1.5 text-[14px] transition-colors ${
                  isActive(child.href)
                    ? "bg-ink-light text-parchment"
                    : "text-parchment/60 hover:bg-ink-light/60"
                }`}
              >
                {child.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
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
            {items.map((entry) => renderItem(entry))}
          </nav>

          <div className="border-t border-parchment/10 px-6 py-5">
            <p className="font-mono text-[11px] uppercase text-brass-light">{roleLabel}</p>
            <p className="mt-1 truncate text-sm text-parchment/80">{personName}</p>
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
