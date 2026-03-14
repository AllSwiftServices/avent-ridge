"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, TrendingUp, AlertCircle, CheckCircle, RefreshCcw, ArrowRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from '@/lib/react-router-shim';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function TradesPage() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [staking, setStaking] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      navigate(createPageUrl('Home'));
    }
  }, [user, isLoadingAuth, navigate]);

  const { data: trades, isLoading: loadingTrades } = useQuery({
    queryKey: ['managed-trades'],
    queryFn: async () => {
      const { data, error } = await api.get<any[]>('/managed-trades');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: wallet } = useQuery({
    queryKey: ['trading-wallet'],
    queryFn: async () => {
      const { data, error } = await api.get<any>('/api/wallets?currency=trading');
      // If direct API fails, try the generic wallets endpoint
      if (error || !data) {
        const res = await api.get<any[]>('/wallets');
        return res.data?.find((w: any) => w.currency === 'trading');
      }
      return data;
    },
    enabled: !!user
  });

  const { data: myStakes, isLoading: loadingStakes } = useQuery({
    queryKey: ['my-managed-stakes'],
    queryFn: async () => {
      const { data, error } = await api.get<any[]>('/managed-trades/my-stakes');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const handleStake = async () => {
    if (!selectedTrade || !stakeAmount) return;
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount < selectedTrade.min_stake) {
      toast.error(`Minimum stake is $${selectedTrade.min_stake}`);
      return;
    }

    setStaking(true);
    try {
      const { error } = await api.post(`/managed-trades/${selectedTrade.id}/stake`, { amount });
      if (error) throw error;
      toast.success("Successfully staked in trade!");
      setSelectedTrade(null);
      setStakeAmount('');
      queryClient.invalidateQueries({ queryKey: ['managed-trades'] });
      queryClient.invalidateQueries({ queryKey: ['trading-wallet'] });
    } catch (err: any) {
      toast.error(err.message || "Failed to stake");
    } finally {
      setStaking(false);
    }
  };

  if (isLoadingAuth || loadingTrades) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const activeTrades = trades?.filter(t => t.status === 'active') || [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 px-4 md:px-8 pt-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Winning Trades</h1>
              <p className="text-muted-foreground">Premium managed trades with guaranteed profit margins.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {activeTrades.length === 0 ? (
            <div className="bg-card border border-border rounded-3xl p-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-1">No Active Trades</h3>
              <p className="text-sm text-muted-foreground">Check back later for new managed trade opportunities.</p>
            </div>
          ) : activeTrades.map((trade, index) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-3xl overflow-hidden group hover:border-primary/30 transition-all shadow-sm"
            >
              <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-muted group-hover:bg-primary/5 flex items-center justify-center transition-colors">
                     <span className="text-2xl font-bold text-primary">{trade.asset_symbol.slice(0, 1)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold">{trade.asset_symbol}</h3>
                      <span className="px-3 py-1 rounded-full bg-success/10 text-success text-xs font-bold">
                        +{trade.profit_percent}% PROFIT
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{trade.asset_name} • {trade.asset_type}</p>
                    <div className="flex flex-wrap gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Ends in {formatDistanceToNow(new Date(trade.ends_at))}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        Min Stake: ${trade.min_stake}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 shrink-0">
                  <button
                    onClick={() => setSelectedTrade(trade)}
                    className="h-12 px-8 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                  >
                    Stake Now <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-wider">
                    Balance: ${Number(wallet?.main_balance || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* My Stakes Section */}
        {myStakes && myStakes.length > 0 && (
          <div className="mt-16 space-y-8">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" /> My Active Trades
              </h2>
              <p className="text-muted-foreground text-sm">Monitor your current trade positions and expected profits.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
               {myStakes.filter(s => s.status === 'active').length === 0 ? (
                 <div className="p-8 rounded-3xl border border-dashed border-border text-center grayscale opacity-50">
                    <p className="text-sm font-medium">No active stakes</p>
                 </div>
               ) : myStakes.filter(s => s.status === 'active').map((stake) => (
                 <div key={stake.id} className="bg-card/50 border border-border p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Zap className="h-6 w-6 text-primary" />
                       </div>
                       <div>
                          <p className="font-bold">{stake.managed_trades?.asset_symbol} Managed Trade</p>
                          <p className="text-xs text-muted-foreground">Staked ${stake.stake_amount} • {stake.managed_trades?.profit_percent}% Profit</p>
                       </div>
                    </div>
                    <div className="flex flex-col md:items-end gap-1">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase">Expected Payout</span>
                       <span className="text-lg font-bold text-success">
                          ${(stake.stake_amount * (1 + stake.managed_trades?.profit_percent / 100)).toLocaleString()}
                       </span>
                    </div>
                 </div>
               ))}
            </div>

            {/* Past Trades */}
            <div className="pt-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" /> Trade History
              </h2>
              <div className="space-y-3">
                {myStakes.filter(s => s.status === 'paid_out').map((stake) => (
                  <div key={stake.id} className="bg-muted/30 border border-border/50 p-4 rounded-2xl flex items-center justify-between opacity-80">
                    <div className="flex items-center gap-3">
                       <CheckCircle className="h-4 w-4 text-success" />
                       <div className="flex flex-col">
                          <span className="text-sm font-bold">{stake.managed_trades?.asset_symbol} Payout</span>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(stake.paid_out_at || stake.created_at), 'MMM dd, yyyy')}</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="text-sm font-bold text-success">+${(stake.stake_amount * (1 + stake.managed_trades?.profit_percent / 100)).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Benefits Card */}
        <div className="mt-12 p-6 rounded-3xl bg-primary/5 border border-primary/10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <p className="font-bold text-sm">Guaranteed Profit</p>
            <p className="text-xs text-muted-foreground text-balance">Our traders manage the position to ensure the target profit is hit.</p>
          </div>
          <div className="flex flex-col gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <p className="font-bold text-sm">Risk Free</p>
            <p className="text-xs text-muted-foreground text-balance">Stakes are insured. If the trade doesn't hit the target, your stake is returned.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <p className="font-bold text-sm">Automated Payout</p>
            <p className="text-xs text-muted-foreground text-balance">Profits are credited to your trading balance automatically on expiry.</p>
          </div>
        </div>
      </div>

      {/* Stake Modal */}
      <AnimatePresence>
        {selectedTrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTrade(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                 <button onClick={() => setSelectedTrade(null)} className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors">
                    <X className="h-5 w-5" />
                 </button>
              </div>

              <div className="mb-8">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                   <Zap className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Stake in {selectedTrade.asset_symbol}</h2>
                <p className="text-sm text-muted-foreground">Earn +{selectedTrade.profit_percent}% profit on your investment.</p>
              </div>

              <div className="space-y-6">
                 <div className="p-4 rounded-2xl bg-muted/30 border border-border flex items-center justify-between">
                   <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Trading Balance</span>
                      <span className="font-bold">${Number(wallet?.main_balance || 0).toLocaleString()}</span>
                   </div>
                   <div className="text-right flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Min Stake</span>
                      <span className="font-bold text-primary">${selectedTrade.min_stake}</span>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">How much to stake?</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="w-full h-14 pl-8 pr-4 bg-muted/50 border border-border rounded-2xl text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                {stakeAmount && !isNaN(parseFloat(stakeAmount)) && (
                  <div className="p-4 rounded-2xl bg-success/5 border border-success/20 flex items-center justify-between">
                     <span className="text-sm font-medium">Expected Payout</span>
                     <span className="text-lg font-bold text-success">
                        ${(parseFloat(stakeAmount) * (1 + selectedTrade.profit_percent / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </span>
                  </div>
                )}

                <button
                  onClick={handleStake}
                  disabled={staking || !stakeAmount || parseFloat(stakeAmount) < selectedTrade.min_stake || parseFloat(stakeAmount) > (wallet?.main_balance || 0) || user?.kyc_status !== 'approved'}
                  className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                >
                  {staking ? <RefreshCcw className="h-5 w-5 animate-spin" /> : "Confirm Stake"}
                </button>

                {user?.kyc_status !== 'approved' && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-[10px] text-destructive font-bold uppercase">
                    <AlertCircle className="h-4 w-4" />
                    KYC Verification required to stake
                  </div>
                )}

                <div className="flex items-center gap-2 justify-center text-[10px] text-muted-foreground font-bold uppercase">
                   <AlertCircle className="h-3.5 w-3.5" />
                   Stakes cannot be withdrawn until trade expiry
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { X, ShieldCheck } from 'lucide-react';
