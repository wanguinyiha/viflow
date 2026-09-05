"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!data) {
        router.push("/login");
        return;
      }

      // Verify the URL matches the user's role
      const roleFromUrl = pathname.split("/")[2]; // /dashboard/{role}
      if (roleFromUrl !== data.role) {
        router.push(`/dashboard/${data.role}`);
        return;
      }

      setProfile(data);
      setLoading(false);
    }

    load();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <p className="font-mono text-sm text-ink/50">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
