"use client";

import React from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/components/auth/auth-provider";
import { FixedChatButton } from "@/components/layout/fixed-chat-button"; // Import FixedChatButton

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-primary-accent text-2xl">
        Loading application...
      </div>
    );
  }

  // Only render layout if authenticated
  if (!session) {
    // AuthProvider will handle redirection to /login
    return null;
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <Sidebar />
      </div>
      <div className="flex flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
      <FixedChatButton /> {/* Render the fixed chat button */}
    </div>
  );
}