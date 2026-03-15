"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Clock, TrendingUp, AlertCircle, CheckCircle, 
  RefreshCcw, ArrowRight, ShieldCheck, X, Activity,
  LineChart, LayoutDashboard, History, Wallet, 
  ArrowUpCircle, Info, Timer, Target
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from '@/lib/react-router-shim';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import AssetSelector from '@/components/trading/AssetSelector';
import CandlestickChart from '@/components/trading/CandlestickChart';

export default function TradesPage() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [staking, setStaking] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'history'>('dashboard');

  useEffect(() => {
    if (!isLoadingAuth && !user) navigate(createPageUrl('Home'));
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

  const activeTrades = useMemo(() => trades?.filter(t => t.status === 'active') || [], [trades]);

  // Set default selected trade if none selected
  useEffect(() => {
    if (activeTrades.length > 0 && !selectedTrade) {
      setSelectedTrade(activeTrades[0]);
    }
  }, [activeTrades, selectedTrade]);

  const { data: wallet } = useQuery({
    queryKey: ['trading-wallet'],
    queryFn: async () => {
      const { data, error } = await api.get<any>('/api/wallets?currency=trading');
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
      setStakeAmount('');
      queryClient.invalidateQueries({ queryKey: ['managed-trades'] });
      queryClient.invalidateQueries({ queryKey: ['trading-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['my-managed-stakes'] });
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

  // Map active trades to the format AssetSelector expects
  const tradeAssets = activeTrades.map(t => ({
    symbol: t.asset_symbol,
    name: t.asset_name,
    type: t.asset_type,
    tradeId: t.id,
    ...t
  }));

  const handleAssetChange = (asset: any) => {
    const trade = activeTrades.find(t => t.id === asset.tradeId);
    if (trade) setSelectedTrade(trade);
  };

  const walletBalance = Number(wallet?.main_balance || 0);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-8">
      {/* --- DASHBOARD HEADER --- */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Managed Trading</h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none mt-1">
                Expert-Led Signals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode('dashboard')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                viewMode === 'dashboard' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </button>
            <button 
              onClick={() => setViewMode('history')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                viewMode === 'history' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <History className="h-4 w-4" /> Activity
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <AnimatePresence mode="wait">
          {viewMode === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6"
            >
              {/* LEFT COLUMN: Chart & Info */}
              <div className="space-y-6">
                {activeTrades.length === 0 ? (
                  <div className="bg-card border border-border border-dashed rounded-[2.5rem] p-12 text-center h-[500px] flex flex-col items-center justify-center">
                    <Clock className="h-16 w-16 text-muted-foreground/20 mb-4" />
                    <h2 className="text-xl font-bold">No Active Signals</h2>
                    <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                      Our expert traders are currently analyzing the markets. New signals will appear here shortly.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Header + Selector */}
                    <div className="bg-card border border-border rounded-[2.5rem] p-6 lg:p-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                         <div className="space-y-1">
                            <AssetSelector 
                              selected={selectedTrade ? { symbol: selectedTrade.asset_symbol, type: selectedTrade.asset_type } : null} 
                              assets={tradeAssets}
                              onChange={handleAssetChange} 
                            />
                            <p className="text-sm text-muted-foreground px-1">{selectedTrade?.asset_name} • Managed Trade</p>
                         </div>
                         <div className="flex items-center gap-6">
                            <div className="text-right">
                               <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Profit Target</p>
                               <span className="text-2xl font-black text-success">+{selectedTrade?.profit_percent}%</span>
                            </div>
                            <div className="h-10 w-px bg-border hidden md:block" />
                            <div className="text-right">
                               <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Ends In</p>
                               <span className="text-lg font-bold">
                                 {selectedTrade?.ends_at ? formatDistanceToNow(new Date(selectedTrade.ends_at)) : 'N/A'}
                               </span>
                            </div>
                         </div>
                      </div>

                      {/* Chart */}
                      <div className="rounded-3xl bg-muted/30 border border-border p-4">
                        <CandlestickChart 
                          basePrice={selectedTrade?.entry_price || 100} 
                          isPositive={selectedTrade?.signal_type === 'call'} 
                        />
                      </div>
                    </div>

                    {/* Signal Intel */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="bg-card border border-border rounded-3xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                             <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Activity className="h-5 w-5 text-primary" />
                             </div>
                             <h4 className="font-bold">Signal Logic</h4>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Position opened based on high-probability technical breakout. Expected to hit target within {selectedTrade?.duration || 'the specified timeframe'}.
                          </p>
                       </div>
                       <div className="bg-card border border-border rounded-3xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                             <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                <Target className="h-5 w-5 text-orange-500" />
                             </div>
                             <h4 className="font-bold">Entry Point</h4>
                          </div>
                          <p className="text-xl font-bold text-foreground">
                            {selectedTrade?.signal_type === 'call' ? 'UP' : 'DOWN'} @ ${selectedTrade?.entry_price?.toLocaleString()}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Target Entry Execution</p>
                       </div>
                       <div className="bg-card border border-border rounded-3xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                             <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                                <ShieldCheck className="h-5 w-5 text-success" />
                             </div>
                             <h4 className="font-bold">Risk Management</h4>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Managed by internal trading desk. Original stake is fully insured by platform liquidity pool.
                          </p>
                       </div>
                    </div>
                  </>
                )}
              </div>

              {/* RIGHT COLUMN: Staking Panel */}
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 sticky top-28">
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-2">Stake in Trade</h3>
                    <p className="text-sm text-muted-foreground">Secure your position in this managed signal.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Available Balance</p>
                          <p className="font-bold text-lg">${walletBalance.toLocaleString()}</p>
                       </div>
                       <Wallet className="h-6 w-6 text-muted-foreground opacity-30" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between px-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Stake Amount</label>
                        <span className="text-[10px] font-bold text-primary uppercase">Min: ${selectedTrade?.min_stake || 0}</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold opacity-40">$</span>
                        <input 
                          type="number"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full h-14 pl-10 pr-4 bg-muted/30 border border-border rounded-2xl text-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>

                    {stakeAmount && !isNaN(parseFloat(stakeAmount)) && (
                      <div className="p-4 rounded-2xl bg-success/5 border border-success/20 space-y-3">
                         <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Stake Value</span>
                            <span className="font-bold">${parseFloat(stakeAmount).toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Profit ({selectedTrade?.profit_percent}%)</span>
                            <span className="font-bold text-success">+${(parseFloat(stakeAmount) * (selectedTrade?.profit_percent / 100)).toLocaleString()}</span>
                         </div>
                         <div className="h-px bg-success/10" />
                         <div className="flex justify-between items-center">
                            <span className="text-sm font-bold">Projected Payout</span>
                            <span className="text-lg font-black text-success">
                               ${(parseFloat(stakeAmount) * (1 + selectedTrade?.profit_percent / 100)).toLocaleString()}
                            </span>
                         </div>
                      </div>
                    )}

                    <button 
                      onClick={handleStake}
                      disabled={staking || !stakeAmount || parseFloat(stakeAmount) < (selectedTrade?.min_stake || 0) || parseFloat(stakeAmount) > walletBalance || !selectedTrade}
                      className="w-full h-14 bg-primary text-primary-foreground font-black rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                    >
                      {staking ? <RefreshCcw className="h-5 w-5 animate-spin" /> : "Open Position"}
                      {!staking && <ArrowRight className="h-5 w-5" />}
                    </button>

                    <div className="flex items-center gap-2 justify-center text-[10px] text-muted-foreground font-bold uppercase py-2">
                       <ShieldCheck className="h-4 w-4 text-success" />
                       Fully Protected Principal
                    </div>
                  </div>
                </div>

                {/* My active positions - mini list */}
                {myStakes && myStakes.filter(s => s.status === 'active').length > 0 && (
                   <div className="bg-card border border-border rounded-3xl p-6">
                      <h4 className="text-sm font-bold mb-4 flex items-center justify-between">
                         My Active Positions
                         <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">
                            {myStakes.filter(s => s.status === 'active').length}
                         </span>
                      </h4>
                      <div className="space-y-3">
                         {myStakes.filter(s => s.status === 'active').slice(0, 3).map(stake => (
                            <div key={stake.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/50">
                               <div>
                                  <p className="text-xs font-bold">{stake.managed_trades?.asset_symbol}</p>
                                  <p className="text-[10px] text-muted-foreground">${stake.stake_amount}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-xs font-bold text-success">+${(stake.stake_amount * (stake.managed_trades?.profit_percent / 100)).toFixed(2)}</p>
                                  <Timer className="h-3 w-3 text-muted-foreground ml-auto mt-0.5" />
                               </div>
                            </div>
                         ))}
                         {myStakes.filter(s => s.status === 'active').length > 3 && (
                            <button onClick={() => setViewMode('history')} className="w-full py-2 text-[10px] font-bold text-muted-foreground uppercase hover:text-primary transition-colors">
                               View all positions
                            </button>
                         )}
                      </div>
                   </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Stakes */}
                <div>
                   <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                      <Activity className="h-6 w-6 text-primary" /> Active Stakes
                   </h2>
                   <div className="space-y-4">
                      {myStakes && myStakes.filter(s => s.status === 'active').length === 0 ? (
                        <div className="p-12 rounded-[2.5rem] border border-dashed border-border flex flex-col items-center justify-center opacity-40">
                           <LayoutDashboard className="h-10 w-10 mb-2" />
                           <p className="text-sm font-bold italic">No active positions</p>
                        </div>
                      ) : myStakes?.filter(s => s.status === 'active').map(stake => (
                        <div key={stake.id} className="bg-card border border-border p-6 rounded-[2rem] flex items-center justify-between shadow-sm">
                           <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                 <b className="text-primary">{stake.managed_trades?.asset_symbol.slice(0, 1)}</b>
                              </div>
                              <div>
                                 <p className="font-bold">{stake.managed_trades?.asset_symbol} Signal</p>
                                 <p className="text-xs text-muted-foreground">
                                   Staked ${stake.stake_amount} • Entry: {stake.managed_trades?.signal_type} @ {stake.managed_trades?.entry_price}
                                 </p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Expected Payout</p>
                              <p className="text-xl font-black text-success">
                                ${ (stake.stake_amount * (1 + (stake.managed_trades?.profit_percent || 0) / 100)).toLocaleString()}
                              </p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* History Stakes */}
                <div>
                   <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                      <History className="h-6 w-6 text-muted-foreground" /> Stake History
                   </h2>
                   <div className="space-y-3">
                      {myStakes && myStakes.filter(s => s.status !== 'active').length === 0 ? (
                        <div className="p-12 rounded-[2.5rem] border border-dashed border-border flex flex-col items-center justify-center opacity-40">
                           <History className="h-10 w-10 mb-2" />
                           <p className="text-sm font-bold italic">No history available</p>
                        </div>
                      ) : myStakes?.filter(s => s.status !== 'active').map(stake => (
                        <div key={stake.id} className="bg-muted/30 border border-border/50 p-5 rounded-2xl flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              {stake.status === 'paid_out' ? <CheckCircle className="h-5 w-5 text-success" /> : <X className="h-5 w-5 text-destructive" />}
                              <div>
                                 <p className="text-sm font-bold">{stake.managed_trades?.asset_symbol} - {stake.status === 'paid_out' ? 'Settled' : 'Lost'}</p>
                                 <p className="text-[10px] text-muted-foreground uppercase font-bold">{format(new Date(stake.created_at), 'MMM dd, yyyy')}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className={cn("text-sm font-black", stake.status === 'paid_out' ? "text-success" : "text-destructive")}>
                                 {stake.status === 'paid_out' ? `+$${(stake.stake_amount * (1 + (stake.managed_trades?.profit_percent || 0) / 100)).toLocaleString()}` : `$0.00`}
                              </p>
                              <span className="text-[10px] text-muted-foreground font-bold">Stake: ${stake.stake_amount}</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
