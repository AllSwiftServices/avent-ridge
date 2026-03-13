"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  CreditCard, 
  Building, 
  Smartphone,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useNavigate } from '@/lib/react-router-shim';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import WalletCard from '@/components/wallet/WalletCard';
import { showToast } from '@/lib/toast';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';

export default function WalletPage() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hideBalance, setHideBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'deposits' | 'withdrawals'>('all');

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

  const { data: wallets, isLoading: isLoadingWallets } = useQuery({
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

  const { data: transactions, isLoading: isLoadingTx } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await api.get<any[]>('/transactions');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const wallet = wallets?.[0] || { main_balance: 0 };
  const cryptoHoldings = portfolio?.filter(p => p.asset_type === 'crypto') || [];
  const stockHoldings = portfolio?.filter(p => p.asset_type === 'stock') || [];

  const calcValue = (holdings: any[]) => holdings.reduce((sum, h) => {
    const asset = assets?.find(a => a.symbol === h.asset_symbol);
    return sum + (h.quantity * (asset?.price || h.avg_buy_price));
  }, 0);

  const cryptoValue = calcValue(cryptoHoldings);
  const stockValue = calcValue(stockHoldings);
  const mainBalance = wallet.main_balance || 0;

  const filteredTransactions = transactions?.filter(tx => {
    if (activeTab === 'all') return true;
    if (activeTab === 'deposits') return tx.type === 'deposit' || tx.type === 'sell';
    if (activeTab === 'withdrawals') return tx.type === 'withdraw' || tx.type === 'buy';
    return true;
  }) || [];

  if (isLoadingAuth || isLoadingWallets) {
    return (
      <div className="min-h-screen pb-24 px-4 py-8 space-y-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b bg-background/95 border-border">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="font-bold text-2xl">Wallet</h1>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" className="rounded-full">
              <History className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-8">
        {/* Balances Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <WalletCard
            type="main"
            title="Fiat Wallet"
            balance={mainBalance}
            change={0}
            hideBalance={hideBalance}
            onToggleHide={() => setHideBalance(!hideBalance)}
            onDeposit={() => showToast.info('Deposit feature coming soon!')}
            onWithdraw={() => showToast.info('Withdraw feature coming soon!')}
          />
          <WalletCard
            type="crypto"
            title="Crypto Wallet"
            balance={cryptoValue}
            change={2.5}
            hideBalance={hideBalance}
            onToggleHide={() => setHideBalance(!hideBalance)}
          />
          <WalletCard
            type="stocks"
            title="Stocks Wallet"
            balance={stockValue}
            change={-1.2}
            hideBalance={hideBalance}
            onToggleHide={() => setHideBalance(!hideBalance)}
          />
        </div>

        {/* Payment Methods */}
        <div>
          <h3 className="font-bold text-lg mb-4">Payment Methods</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: CreditCard, label: 'Bank Card', color: 'bg-blue-500' },
              { icon: Building, label: 'Bank Transfer', color: 'bg-emerald-500' },
              { icon: Smartphone, label: 'E-Wallet', color: 'bg-purple-500' },
              { icon: Plus, label: 'Add New', color: 'bg-muted', isAction: true },
            ].map((method, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-3xl border border-border bg-card",
                  method.isAction ? "border-dashed" : "shadow-sm"
                )}
              >
                <div className={cn("p-3 rounded-2xl mb-2", method.color, method.isAction ? "bg-muted text-muted-foreground" : "text-white")}>
                  <method.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">{method.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Transactions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Transactions</h3>
            <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
              {(['all', 'deposits', 'withdrawals'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                    activeTab === tab 
                      ? "bg-card text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {isLoadingTx ? (
              <CardSkeleton />
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-3xl border border-border">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              filteredTransactions.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors group cursor-pointer"
                >
                  <div className={cn(
                    "p-3 rounded-xl",
                    tx.type === 'deposit' || tx.type === 'sell' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  )}>
                    {tx.type === 'deposit' || tx.type === 'sell' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm capitalize">{tx.type} {tx.symbol ? `- ${tx.symbol}` : ''}</span>
                      {tx.status === 'completed' ? (
                        <CheckCircle2 className="h-3 w-3 text-success" />
                      ) : tx.status === 'pending' ? (
                        <Clock className="h-3 w-3 text-amber-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-destructive" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={cn(
                      "font-bold text-sm",
                      tx.type === 'deposit' || tx.type === 'sell' ? "text-success" : "text-destructive"
                    )}>
                      {tx.type === 'deposit' || tx.type === 'sell' ? '+' : '-'}${tx.total_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">{tx.status}</p>
                  </div>
                  
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
