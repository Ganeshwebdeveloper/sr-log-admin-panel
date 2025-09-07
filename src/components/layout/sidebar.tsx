"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Home, MessageSquare, Bell, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/home", icon: Home, label: "Dashboard" },
    { href: "/drivers", icon: Users, label: "Drivers" },
    { href: "/vehicles", icon: Car, label: "Vehicles" },
    { href: "/trips", icon: MessageSquare, label: "Trips" }, // Using MessageSquare as a placeholder for Trips icon
  ];

  return (
    <aside className={cn("h-full w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col p-4", className)}>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">SR Logistics</h2>
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              pathname === item.href
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}