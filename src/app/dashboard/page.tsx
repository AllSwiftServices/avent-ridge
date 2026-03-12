"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, TrendingUp, TrendingDown, Bell, Search, Menu, Sun, Moon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useNavigate } from '@/lib/react-router-shim';
import { createPageUrl } from '@/utils';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useAuth } from '@/lib/AuthContext';
import BalanceChart from '@/components/dashboard/BalanceChart';
import WalletBreakdown from '@/components/dashboard/WalletBreakdown';
import QuickActions from '@/components/dashboard/QuickActions';
import TopMovers from '@/components/dashboard/TopMovers';
import AnimatedNumber from '@/components/common/AnimatedNumber';

export default function Dashboard() {
  const [hideBalance, setHideBalance] = useState(false);
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      navigate(createPageUrl('Home'));
    }
  }, [user, isLoadingAuth, navigate]);

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('assets').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('wallets').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data, error } = await supabase.from('portfolio').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const wallet = wallets?.[0] || { main_balance: 10000 };
  const cryptoHoldings = portfolio?.filter(p => p.asset_type === 'crypto') || [];
  const stockHoldings = portfolio?.filter(p => p.asset_type === 'stock') || [];

  const calcValue = (holdings: any[]) => holdings.reduce((sum, h) => {
    const asset = assets?.find(a => a.symbol === h.asset_symbol);
    return sum + (h.quantity * (asset?.price || h.avg_buy_price));
  }, 0);

  const cryptoValue = calcValue(cryptoHoldings);
  const stockValue = calcValue(stockHoldings);
  const mainBalance = wallet.main_balance || 10000;
  const totalBalance = mainBalance + cryptoValue + stockValue;
  const totalChange = 2.45;
  const isPositive = totalChange >= 0;
  const changeDollar = (totalBalance * totalChange) / 100;

  if (isLoadingAuth) return null;

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: theme === 'dark' ? 'hsl(240 5% 5%)' : '#F5F6FA', color: theme === 'dark' ? '#fff' : '#1A1A2E' }}>
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b" style={{ background: theme === 'dark' ? 'rgba(13,13,20,0.95)' : 'rgba(245,246,250,0.9)', borderColor: theme === 'dark' ? 'hsl(240 5% 14%)' : '#E0E0E8' }}>
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Menu icon → Profile */}
          <button onClick={() => navigate(createPageUrl('Profile'))} className="p-2 rounded-xl transition-colors flex-shrink-0" style={{ color: theme === 'dark' ? '#9CA3AF' : '#4B5563' }}>
            <Menu className="h-5 w-5" />
          </button>

          {/* Search bar */}
          <div
            className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full cursor-pointer"
            style={{ background: theme === 'dark' ? 'hsl(240 5% 12%)' : '#EAECF0' }}
            onClick={() => navigate(createPageUrl('Markets'))}
          >
            <Search className="h-4 w-4 flex-shrink-0" style={{ color: '#9CA3AF' }} />
            <span className="text-sm truncate" style={{ color: '#9CA3AF' }}>Search...</span>
          </div>

          {/* Dark/Light mode toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ background: theme === 'dark' ? 'hsl(240 5% 12%)' : '#EAECF0' }}
          >
            {theme === 'dark'
              ? <Sun className="h-4 w-4" style={{ color: '#FFC107' }} />
              : <Moon className="h-4 w-4" style={{ color: '#4B5563' }} />
            }
          </button>

          {/* Bell */}
          <button className="p-2 rounded-xl transition-colors relative flex-shrink-0" style={{ color: theme === 'dark' ? '#9CA3AF' : '#4B5563' }}>
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-8">
        {/* ── SECTION 1: Portfolio Overview ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <p className="text-sm font-medium" style={{ color: '#6B7280' }}>Portfolio Value</p>
            <button onClick={() => setHideBalance(h => !h)}>
              {hideBalance
                ? <EyeOff className="h-4 w-4" style={{ color: '#6B7280' }} />
                : <Eye className="h-4 w-4" style={{ color: '#6B7280' }} />}
            </button>
          </div>

          {hideBalance ? (
            <p className="text-4xl font-bold tracking-tight" style={{ color: '#1A1A2E' }}>••••••••</p>
          ) : (
            <AnimatedNumber value={totalBalance} prefix="$" decimals={2} className="text-4xl font-bold tracking-tight" style={{ color: '#1A1A2E' }} />
          )}

          <div className={cn('flex items-center justify-center gap-1.5 mt-2 text-sm font-semibold')}>
            {isPositive ? <TrendingUp className="h-4 w-4" style={{ color: '#FFC107' }} /> : <TrendingDown className="h-4 w-4" style={{ color: '#E53935' }} />}
            <span style={{ color: isPositive ? '#FFC107' : '#E53935' }}>
              {isPositive ? '+' : ''}{totalChange.toFixed(2)}%
            </span>
            <span style={{ color: '#6B7280' }}>
              ({isPositive ? '+' : ''}${Math.abs(changeDollar).toFixed(2)}) today
            </span>
          </div>

          {/* Chart */}
          <div className="mt-6 rounded-3xl p-4 border" style={{ background: '#FFFFFF', borderColor: '#E0E0E8', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <BalanceChart totalBalance={totalBalance} isPositive={isPositive} />
          </div>
        </motion.div>

        {/* ── SECTION 2: Wallet Breakdown ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="font-bold text-base mb-3" style={{ color: '#1A1A2E' }}>Wallets</p>
          <WalletBreakdown
            mainBalance={mainBalance}
            cryptoValue={cryptoValue || 5420.5}
            stockValue={stockValue || 3250.75}
            hideBalance={hideBalance}
          />
        </motion.div>

        {/* ── SECTION 3: Quick Actions ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <QuickActions
            onDeposit={() => navigate(createPageUrl('WalletPage'))}
            onTrade={() => navigate(createPageUrl('LiveTrading'))}
            onWithdraw={() => navigate(createPageUrl('WalletPage'))}
          />
        </motion.div>

        {/* ── SECTION 4: Top Movers ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-1">
            <span />
            <button
              onClick={() => navigate(createPageUrl('Markets'))}
              className="text-xs font-semibold"
              style={{ color: '#FFC107' }}
            >
              See all →
            </button>
          </div>
          <TopMovers
            assets={assets}
            onAssetClick={(asset: any) => navigate(createPageUrl('Markets') + `?asset=${asset.symbol}`)}
          />
        </motion.div>
      </div>
    </div>
  );
}