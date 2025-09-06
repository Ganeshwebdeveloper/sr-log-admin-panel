"use client";

import { Button } from '@/components/ui/button';
import { supabaseBrowser } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const supabase = supabaseBrowser;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 to-gray-800 text-white p-4">
      <h1 className="text-4xl font-bold text-neon-blue mb-8">Welcome to SR Logistics Admin Dashboard!</h1>
      <p className="text-lg text-gray-300 mb-8">This is your secure admin panel.</p>
      <Button onClick={handleLogout} className="bg-destructive hover:bg-destructive/80 text-white font-bold">
        Logout
      </Button>
    </div>
  );
}