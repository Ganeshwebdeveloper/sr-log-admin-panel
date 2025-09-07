"use client";

import React from "react";
import Link from "next/link";
import { Menu, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/components/auth/auth-provider";
import { supabaseBrowser } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = supabaseBrowser;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out.");
    } else {
      toast.success("Logged out successfully!");
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background px-4 md:px-6 shadow-sm">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden bg-transparent border-primary-accent/30 text-primary-accent hover:bg-primary-accent/10"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col bg-sidebar border-r border-sidebar-border">
          <Sidebar />
        </SheetContent>
      </Sheet>
      <Link href="/home" className="flex items-center gap-2 text-lg font-semibold md:text-base text-secondary-accent hover:text-secondary-accent/80">
        SR Logistics Admin
      </Link>
      <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full bg-gray-700/50 border-primary-accent/20 text-primary-accent hover:bg-gray-600/50">
              <Avatar>
                <AvatarImage src={user?.user_metadata?.avatar_url || "https://github.com/shadcn.png"} alt="User Avatar" />
                <AvatarFallback className="bg-primary-accent/20 text-primary-accent">{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
            <DropdownMenuLabel className="text-secondary-accent">{user?.email || "My Account"}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="hover:bg-accent hover:text-accent-foreground cursor-pointer">
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-accent hover:text-accent-foreground cursor-pointer">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem onClick={handleLogout} className="hover:bg-destructive/20 hover:text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}