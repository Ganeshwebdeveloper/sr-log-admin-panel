"use client";

import React from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
// No need for useAuth here anymore for conditional rendering
import { FixedChatButton } from "@/components/layout/fixed-chat-button"; // Import FixedChatButton

export function MainLayout({ children }: { children: React.ReactNode }) {
  // The AuthProvider now ensures that MainLayout is only rendered when a session exists
  // and the user is not on the login page.
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