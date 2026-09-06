"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { Profile } from "@/lib/types";

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: false });

export function useAuth() {
  return useContext(AuthContext);
}

// Mock profiles for dashboard preview mode (no auth required)
const mockProfiles: Record<string, Profile> = {
  admin: {
    id: "00000000-0000-0000-0000-000000000001",
    full_name: "Sarah Mwangi",
    email: "admin@viflow.com",
    phone: "+254 700 000001",
    role: "admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  resident: {
    id: "00000000-0000-0000-0000-000000000002",
    full_name: "Tendai Wanjiru",
    email: "resident@viflow.com",
    phone: "+254 700 000002",
    role: "resident",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  guard: {
    id: "00000000-0000-0000-0000-000000000003",
    full_name: "James Otieno",
    email: "guard@viflow.com",
    phone: "+254 700 000003",
    role: "guard",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  visitor: {
    id: "00000000-0000-0000-0000-000000000004",
    full_name: "Amara Kimani",
    email: "visitor@viflow.com",
    phone: "+254 700 000004",
    role: "visitor",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Detect role from URL path: /dashboard/{role}/...
  const pathParts = pathname.split("/");
  const roleFromUrl = (pathParts[2] ?? "resident") as string;
  const user = mockProfiles[roleFromUrl] ?? mockProfiles.resident;

  return (
    <AuthContext.Provider value={{ user, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}
