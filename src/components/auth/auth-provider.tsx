"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase';
import { Toaster } from '@/components/ui/sonner'; // Import Toaster for notifications

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = supabaseBrowser;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);

      if (session && pathname === '/login') {
        router.push('/home');
      } else if (!session && pathname !== '/login') {
        router.push('/login');
      }
    });

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
      if (session && pathname === '/login') {
        router.push('/home');
      } else if (!session && pathname !== '/login') {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, pathname, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-neon-blue text-2xl">
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
      {children}
      <Toaster /> {/* Add Toaster here for global notifications */}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};