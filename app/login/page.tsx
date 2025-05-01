// app/login/page.tsx
// -----------------------------------------------------------------------------
// Client‑side login page with full‑screen progress indicator.
// 1) Authenticate with Supabase
// 2) Persist Supabase session
// 3) Sign in to Bit2Bit OAuth API
// 4) Show loading/progress until Next.js navigates away to /dashboard
// -----------------------------------------------------------------------------
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import { LoginForm } from '@/components/login-form';
import { supabase } from '@/lib/supabase';
import { b2bApi } from '@/lib/b2b-api';
import { Progress } from '@/components/ui/progress';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
const COOKIE_NAME = 'userSession';
const ONE_HOUR = 3600_000; // ms

function persistSupabaseSession (session: any, ttlMs: number = ONE_HOUR) {
  const expires = new Date(Date.now() + ttlMs);
  Cookies.set(COOKIE_NAME, JSON.stringify(session), {
    expires,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
export default function LoginPage () {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Kick off a simple progress loop while `loading` is true
  const startProgress = () => {
    setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 10 : prev));
    }, 200);
  };

  const stopProgress = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(100);
  };

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError('');
    startProgress();

    try {
      // 1️⃣ Supabase authentication
      const { error: signinErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signinErr) throw new Error('Invalid credentials or user does not exist.');

      const { data: { session }, error: sessErr } = await supabase.auth.getSession();
      if (sessErr || !session) throw new Error('Failed to establish session.');

      persistSupabaseSession(session);

      // 2️⃣ Bit2Bit OAuth sign‑in
      await b2bApi.signIn({
        email: process.env.NEXT_PUBLIC_B2B_EMAIL ?? email,
        password: process.env.NEXT_PUBLIC_B2B_PASSWORD ?? password,
      });

      // 3️⃣ Completed – force progress to 100 then navigate
      stopProgress();
      router.push('/dashboard');
      // Do NOT setLoading(false); component will unmount on navigation.
    } catch (err: any) {
      console.error('[Login]', err);
      setError(err.message ?? 'Unexpected error – please try again.');
      setLoading(false);
      stopProgress();
    }
  };

  // -------------------- RENDER ---------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Progress value={progress} max={100} className="w-1/2" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm onSubmit={handleLogin} error={error} loading={loading} />
      </div>
    </div>
  );
}
