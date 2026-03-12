"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Shield, Moon, Sun, ChevronRight, LogOut,
  CheckCircle, Clock, X, Lock, Bell, HelpCircle, FileText, Mail
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ui/ThemeProvider';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const [kycRecord, setKycRecord] = useState<any>(null);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadKyc();
    }
  }, [user]);

  const loadKyc = async () => {
    try {
      if (!user) return;
      const { data, error } = await supabase
        .from('kyc')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) setKycRecord(data);
    } catch (error) {
      console.error('Error loading KYC:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  interface MenuItem {
    icon: any;
    label: string;
    action: () => void;
    badge?: string;
    badgeColor?: string;
    toggle?: boolean;
    checked?: boolean;
  }

  interface MenuSection {
    title: string;
    items: MenuItem[];
  }

  const menuItems: MenuSection[] = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Personal Information', action: () => router.push('/verify-identity') },
        {
          icon: Shield,
          label: 'KYC Verification',
          badge: kycRecord?.status === 'approved' ? '✔ Verified' : kycRecord?.status === 'pending' ? '⏳ Pending' : kycRecord?.status === 'rejected' ? '✖ Failed' : 'Not Started',
          badgeColor: kycRecord?.status === 'approved' ? 'text-primary bg-primary/10' : kycRecord?.status === 'rejected' ? 'text-destructive bg-destructive/10' : 'text-muted-foreground bg-muted',
          action: () => router.push('/verify-identity')
        },
        { icon: Lock, label: 'Security Settings', action: () => { } },
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: theme === 'dark' ? Moon : Sun,
          label: 'Dark Mode',
          toggle: true,
          checked: theme === 'dark',
          action: toggleTheme
        },
        { icon: Bell, label: 'Notifications', action: () => { } },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', action: () => { } },
        { icon: FileText, label: 'Terms & Privacy', action: () => { } },
      ]
    }
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b bg-background/95 border-border">
        <div className="px-4 py-4">
          <h1 className="font-bold text-2xl">Profile</h1>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* User Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-card border border-border"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl bg-primary text-primary-foreground">
              {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user?.user_metadata?.full_name || 'User'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                {kycRecord?.status === 'approved' && <div className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-primary" /><span className="text-xs font-medium text-primary">Verified</span></div>}
                {kycRecord?.status === 'pending' && <div className="flex items-center gap-1"><Clock className="h-4 w-4 text-primary" /><span className="text-xs font-medium text-primary">Pending AI Verification</span></div>}
                {kycRecord?.status === 'rejected' && <div className="flex items-center gap-1"><X className="h-4 w-4 text-destructive" /><span className="text-xs font-medium text-destructive">Verification Failed</span></div>}
                {(user as any)?.email_verified && <div className="flex items-center gap-1"><Mail className="h-4 w-4 text-primary" /><span className="text-xs font-semibold text-primary">Email Verified</span></div>}
                {!kycRecord && !(user as any)?.email_verified && <div className="flex items-center gap-1"><Shield className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground font-medium">Not Verified</span></div>}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Menu Sections */}
        {menuItems.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (sectionIndex + 1) * 0.1 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
              {section.title}
            </h3>
            <div className="rounded-3xl bg-card border border-border overflow-hidden">
              {section.items.map((item, itemIndex) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={cn(
                    'w-full flex items-center justify-between p-4',
                    'hover:bg-muted/50 transition-colors',
                    itemIndex !== section.items.length - 1 && 'border-b border-border'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className={cn('text-xs font-medium px-2 py-1 rounded-full', item.badgeColor)}>
                        {item.badge}
                      </span>
                    )}
                    {item.toggle ? (
                      <Switch checked={item.checked} onCheckedChange={item.action} />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center justify-center gap-2 p-4',
            'rounded-2xl bg-destructive/10 text-destructive',
            'font-bold hover:bg-destructive/20 transition-colors'
          )}
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </motion.button>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground">
          Avent Ridge v1.0.0
        </p>
      </div>
    </div>
  );
}