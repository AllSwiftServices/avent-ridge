"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, isLoadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth && user) {
      router.push('/dashboard');
    }
  }, [user, isLoadingAuth, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) alert(error.message);
      else alert('Check your email for the confirmation link!');
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
      },
    });
    if (error) alert(error.message);
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center"
        >
          <Zap className="h-6 w-6 text-white animate-pulse" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

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
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold">Avent Ridge</span>
            </div>
          </motion.div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Trade Smarter.</h1>
            <h1 className="text-3xl font-bold text-primary mb-4">Grow Faster.</h1>
            <p className="text-muted-foreground">
              Access stocks, crypto, and more from one powerful platform
            </p>
          </div>

          {/* Auth Card */}
          <motion.div
            layout
            className="bg-card rounded-3xl p-6 shadow-xl border border-border"
          >
            {/* Toggle */}
            <div className="flex gap-2 p-1 bg-muted rounded-2xl mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={cn(
                  'flex-1 py-3 rounded-xl font-semibold transition-all',
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
                  'flex-1 py-3 rounded-xl font-semibold transition-all',
                  !isLogin
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 rounded-2xl"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-14 rounded-2xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {isLogin && (
                <div className="text-right">
                  <button type="button" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl font-semibold text-lg bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 transition-opacity btn-press"
              >
                {isLogin ? 'Enter Dashboard' : 'Create Account'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full h-14 rounded-2xl font-medium btn-press"
            >
              <Chrome className="mr-2 h-5 w-5" />
              Google
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-6">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}