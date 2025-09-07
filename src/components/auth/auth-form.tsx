"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type AuthMode = 'login' | 'signup' | 'otp' | 'magiclink';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = supabaseBrowser;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged in successfully!');
      router.push('/home');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Sign up successful! Please check your email to confirm.');
      setMode('login'); // After signup, prompt for login
    }
    setLoading(false);
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Magic link sent! Check your email.');
    }
    setLoading(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('OTP sent! Check your email.');
      setMode('otp');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email' as const, // Explicitly define 'email' as a literal type
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('OTP verified! You are now logged in.');
        router.push('/home');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Something went wrong during OTP verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-md border border-primary-accent/30 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary-accent">SR Logistics Admin</CardTitle>
        <CardDescription className="text-gray-300">
          {mode === 'login' && 'Login to your account'}
          {mode === 'signup' && 'Create a new account'}
          {mode === 'otp' && 'Verify your OTP'}
          {mode === 'magiclink' && 'Receive a magic link'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={
          mode === 'login' ? handleLogin :
          mode === 'signup' ? handleSignUp :
          mode === 'otp' ? handleVerifyOtp :
          handleSendMagicLink // Default for magiclink mode
        } className="grid gap-4">
          {(mode === 'login' || mode === 'signup' || mode === 'magiclink' || mode === 'otp') && (
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-secondary-accent">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent"
              />
            </div>
          )}
          {(mode === 'login' || mode === 'signup') && (
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-secondary-accent">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent"
              />
            </div>
          )}
          {mode === 'otp' && (
            <div className="grid gap-2">
              <Label htmlFor="otp" className="text-secondary-accent">OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="bg-gray-700/50 border-primary-accent/20 text-white focus:border-primary-accent focus:ring-primary-accent"
              />
            </div>
          )}
          <Button type="submit" className="w-full bg-primary-accent hover:bg-primary-accent/80 text-white font-bold" disabled={loading}>
            {loading ? 'Loading...' :
             mode === 'login' ? 'Login' :
             mode === 'signup' ? 'Sign Up' :
             mode === 'otp' ? 'Verify OTP' :
             'Send Magic Link'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-400">
          {mode === 'login' && (
            <>
              Don't have an account?{' '}
              <Button variant="link" onClick={() => setMode('signup')} className="text-secondary-accent hover:text-secondary-accent/80 p-0 h-auto">
                Sign Up
              </Button>
              <br />
              <Button variant="link" onClick={() => setMode('magiclink')} className="text-primary-accent hover:text-primary-accent/80 p-0 h-auto">
                Login with Magic Link
              </Button>
              <br />
              <Button variant="link" onClick={() => setMode('otp')} className="text-warning-accent hover:text-warning-accent/80 p-0 h-auto">
                Login with OTP
              </Button>
            </>
          )}
          {mode === 'signup' && (
            <>
              Already have an account?{' '}
              <Button variant="link" onClick={() => setMode('login')} className="text-secondary-accent hover:text-secondary-accent/80 p-0 h-auto">
                Login
              </Button>
            </>
          )}
          {(mode === 'otp' || mode === 'magiclink') && (
            <>
              Go back to{' '}
              <Button variant="link" onClick={() => setMode('login')} className="text-secondary-accent hover:text-secondary-accent/80 p-0 h-auto">
                Login
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}