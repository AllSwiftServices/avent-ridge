"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, Chrome, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { AnimatePresence } from 'framer-motion';
import { showToast } from '@/lib/toast';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [isLoading, setIsLoading] = useState(false);
  const { refreshUser, isLoadingAuth, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth && user) {
      router.push('/dashboard');
    }
  }, [user, isLoadingAuth, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        // Direct email + password login — no OTP needed
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Invalid email or password');
        }
        showToast.success('Welcome back!');
        // Poll for session and navigate
        let authed = false;
        for (let i = 0; i < 8; i++) {
          await refreshUser();
          const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' });
          const sessionData = await sessionRes.json();
          if (sessionData?.user) { authed = true; break; }
          await new Promise(r => setTimeout(r, 500));
        }
        if (!authed) throw new Error('Session could not be established. Please try again.');
        window.location.href = '/dashboard';
      } else {
        // Signup — send OTP for email verification
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, type: 'signup' }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to send verification code');
        }
        showToast.success('Verification code sent to your email!');
        setStep('otp');
      }
    } catch (error: any) {
      showToast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Second step: Verify OTP
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          name: !isLogin ? name : undefined,
          type: isLogin ? 'login' : 'signup',
          password: password,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid verification code');
      }

      showToast.success('Success! Entering dashboard...');

      // Poll refreshUser up to 8 times with a 500ms gap to ensure the session
      // cookie has landed before we navigate — prevents the race condition where
      // the dashboard mounts and immediately redirects back to login.
      let authed = false;
      for (let i = 0; i < 8; i++) {
        await refreshUser();
        // Check the auth context value via a direct session call
        const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' });
        const sessionData = await sessionRes.json();
        if (sessionData?.user) {
          authed = true;
          break;
        }
        // Wait 500ms before retrying
        await new Promise(r => setTimeout(r, 500));
      }

      if (!authed) {
        throw new Error('Session could not be established. Please try again.');
      }

      // Hard navigate to flush any client-side cache
      window.location.href = '/dashboard';
    } catch (error: any) {
      showToast.error(error.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    // Note: OAuth still needs some client-side handling but usually redirects to a server route
    // For now, we'll point to a future server-side OAuth route or inform the user
    showToast.info('OAuth is currently being migrated to server-side. Please use email for now.');
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-12 h-12 rounded-xl bg-linear-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg shadow-primary/20"
        >
          <Zap className="h-6 w-6 text-black animate-pulse" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex justify-center mb-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg shadow-primary/30">
                <Zap className="h-7 w-7 text-black" />
              </div>
              <span className="text-2xl font-bold">Avent Ridge</span>
            </div>
          </motion.div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-1">Trade Smarter.</h1>
            <h1 className="text-3xl font-bold text-primary mb-3">Grow Faster.</h1>
            <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
              Access global markets, crypto, and stocks from one elite platform
            </p>
          </div>

          {/* Auth Card */}
          <motion.div
            layout
            className="bg-card/80 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl border border-border/50"
          >
            <AnimatePresence mode="wait">
              {step === 'credentials' ? (
                <motion.div
                  key="credentials"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Toggle */}
                  <div className="flex gap-2 p-1.5 bg-muted/50 rounded-2xl">
                    <button
                      onClick={() => setIsLogin(true)}
                      className={cn(
                        'flex-1 py-3 rounded-xl font-semibold transition-all text-sm',
                        isLogin
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => setIsLogin(false)}
                      className={cn(
                        'flex-1 py-3 rounded-xl font-semibold transition-all text-sm',
                        !isLogin
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Sign Up
                    </button>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-4">
                    {!isLogin && (
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Full Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-12 h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20"
                          required
                        />
                      </div>
                    )}

                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20"
                        required
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-12 h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>

                    {isLogin && (
                      <div className="text-right">
                        <button type="button" className="text-sm text-primary hover:underline font-medium">
                          Forgot password?
                        </button>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-14 rounded-2xl font-bold text-lg bg-linear-to-r from-primary to-amber-500 hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] text-black"
                    >
                      {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                      {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                    </Button>
                  </form>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-4 bg-card/80 text-muted-foreground">or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => signInWithOAuth('google')}
                      className="h-14 rounded-2xl font-bold bg-muted/20 border-border/50 hover:bg-muted/40 transition-all active:scale-[0.98]"
                    >
                      <Chrome className="mr-2 h-5 w-5" />
                      Google
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">{isLogin ? 'Enter OTP' : 'Verify Email'}</h2>
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code sent to <span className="text-foreground font-semibold">{email}</span>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="h-20 text-center text-4xl tracking-[0.5em] font-bold rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20 w-full max-w-[240px]"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-14 rounded-2xl font-bold text-lg bg-linear-to-r from-primary to-amber-500 shadow-xl shadow-primary/20 active:scale-[0.98] text-black"
                      >
                        {isLoading ? 'Verifying...' : 'Verify & Continue'}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep('credentials')}
                        className="h-12 rounded-xl text-muted-foreground hover:text-foreground font-medium"
                      >
                        Change Email
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-center text-[11px] leading-relaxed text-muted-foreground/60 mt-8">
              By continuing, you agree to Avent Ridge's <br />
              <button className="underline hover:text-primary">Terms of Service</button> and <button className="underline hover:text-primary">Privacy Policy</button>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}