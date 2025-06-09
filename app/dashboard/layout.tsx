"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
 import {useSession} from 'next-auth/react'
import { MainNav } from "@/components/main-nav";
import { UserInfo } from "@/components/user-info";
import { ModeToggle } from "@/components/mode-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAuthenticated = () => {
    // Check if the session exists and has a user
    return session && session.user;
  };

  // Let middleware handle authentication redirects
  // Only handle client-side specific cases if needed
  useEffect(() => {
    // No client-side redirects - let middleware handle auth flow
  }, [session]);

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className=" flex h-14 items-center justify-between md:justify-start gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Imprest Manager</h1>
          </div>
          <MainNav />
          <div className="flex items-center gap-2 ml-auto">
            <UserInfo />
            <ModeToggle />
          </div>
        </div>
      </div>
      <main className="flex-1 container py-6">{children}</main>
    </div>
  );
}