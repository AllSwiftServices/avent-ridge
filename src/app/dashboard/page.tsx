"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, TrendingUp, TrendingDown, Bell, Search, User, Sun, Moon } from 'lucide-react';
import { api } from '@/lib/api';
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
import { NotificationDrawer } from '@/components/notifications/NotificationDrawer';

export default function Dashboard() {
  const [hideBalance, setHideBalance] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      navigate(createPageUrl('Home'));
    }
  }, [user, isLoadingAuth, navigate]);

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await api.get<any[]>('/assets');
      if (error) throw error;
      return data;
    }
  });

  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data, error } = await api.get<any[]>('/wallets');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data, error } = await api.get<any[]>('/portfolio');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await api.get<any[]>('/notifications');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 30000 // Refresh every 30s
  });

  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

  const tradingWallet = wallets?.find(w => w.currency === 'trading') || { main_balance: 0 };
  const holdingWallet = wallets?.find(w => w.currency === 'holding') || { main_balance: 0 };

  const cryptoHoldings = portfolio?.filter(p => p.asset_type === 'crypto') || [];
  const stockHoldings = portfolio?.filter(p => p.asset_type === 'stock') || [];

  const calcValue = (holdings: any[]) => holdings.reduce((sum, h) => {
    const asset = assets?.find(a => a.symbol === h.asset_symbol);
    return sum + (h.quantity * (asset?.price || h.avg_buy_price));
  }, 0);

  const cryptoValue = calcValue(cryptoHoldings);
  const stockValue = calcValue(stockHoldings);
  
  const tradingBalance = (tradingWallet.main_balance || 0) + cryptoValue;
  const holdingBalance = (holdingWallet.main_balance || 0) + stockValue;
  
  const totalBalance = tradingBalance + holdingBalance;
  const totalChange = 2.45;
  const isPositive = totalChange >= 0;
  const changeDollar = (totalBalance * totalChange) / 100;

  if (isLoadingAuth) return null;

  return (
    <div className="min-h-screen pb-32 md:pb-8 bg-background text-foreground">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b bg-background/90 border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Menu icon → Profile */}
          <button onClick={() => navigate(createPageUrl('Profile'))} className="p-2 rounded-xl transition-colors shrink-0 text-muted-foreground">
            <User className="h-5 w-5" />
          </button>

          {/* Search bar */}
          <div
            className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full cursor-pointer bg-muted"
            onClick={() => navigate(createPageUrl('Markets'))}
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm truncate text-muted-foreground">Search...</span>
          </div>

          {/* Bell */}
          <button 
            onClick={() => setIsNotificationsOpen(true)}
            className="p-2 rounded-xl transition-colors relative shrink-0 text-muted-foreground"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-destructive text-white text-[10px] flex items-center justify-center rounded-full border-2 border-background font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <NotificationDrawer 
        open={isNotificationsOpen} 
        onOpenChange={setIsNotificationsOpen} 
      />

      <div className="px-4 py-6 space-y-8">
        {/* ── SECTION 1: Portfolio Overview ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <p className="text-sm font-medium text-muted-foreground">Portfolio Value</p>
            <button onClick={() => setHideBalance(h => !h)} className="text-muted-foreground">
              {hideBalance
                ? <EyeOff className="h-4 w-4" />
                : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {hideBalance ? (
            <p className="text-4xl font-bold tracking-tight text-foreground">••••••••</p>
          ) : (
            <AnimatedNumber value={totalBalance} prefix="$" decimals={2} className="text-4xl font-bold tracking-tight text-foreground" />
          )}

          <div className={cn('flex items-center justify-center gap-1.5 mt-2 text-sm font-semibold')}>
            {isPositive ? <TrendingUp className="h-4 w-4 text-primary" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
            <span className={isPositive ? 'text-primary' : 'text-destructive'}>
              {isPositive ? '+' : ''}{totalChange.toFixed(2)}%
            </span>
            <span className="text-muted-foreground">
              ({isPositive ? '+' : ''}${Math.abs(changeDollar).toFixed(2)}) today
            </span>
          </div>

          {/* Chart */}
          <div className="mt-6 rounded-3xl p-4 border bg-card border-border shadow-md">
            <BalanceChart totalBalance={totalBalance} isPositive={isPositive} />
          </div>
        </motion.div>

        {/* ── SECTION 2: Wallet Breakdown ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="font-bold text-base mb-3 text-foreground">Wallets</p>
          <WalletBreakdown
            tradingBalance={tradingBalance}
            holdingBalance={holdingBalance}
            hideBalance={hideBalance}
          />
        </motion.div>

        {/* ── SECTION 3: Quick Actions ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <QuickActions
            onDeposit={() => navigate(createPageUrl('wallet'))}
            onMarkets={() => navigate(createPageUrl('Markets'))}
            onTrade={() => navigate(createPageUrl('trade'))}
            onWithdraw={() => navigate(createPageUrl('wallet'))}
          />
        </motion.div>

        {/* ── SECTION 4: Top Movers ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-1">
            <span />
            <button
              onClick={() => navigate(createPageUrl('Markets'))}
              className="text-xs font-semibold text-primary"
            >
              See all →
            </button>
          </div>
          <TopMovers
            assets={assets || []}
            onAssetClick={(asset: any) => navigate(createPageUrl('Markets') + `?asset=${asset.symbol}`)}
          />
        </motion.div>
      </div>
    </div>
  );
}