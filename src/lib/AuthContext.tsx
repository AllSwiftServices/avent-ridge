"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  name?: string;
  user_metadata?: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  authError: string | null;
  logout: () => Promise<void>;
  navigateToLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch extended profile from public.users
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setUser({
            ...session.user,
            ...profile,
          } as User);
        } else {
          setUser(null);
        }
      } catch (error: any) {
        console.error('Error checking auth session:', error);
        setAuthError(error.message);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser({
          ...session.user,
          ...profile,
        } as User);
      } else {
        setUser(null);
      }
      setIsLoadingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/');
    } catch (error: any) {
      console.error('Error logging out:', error);
    }
  }, [router]);

  const navigateToLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoadingAuth,
      authError,
      logout,
      navigateToLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
