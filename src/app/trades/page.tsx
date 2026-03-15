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

const DigitalClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-xl border border-border/50">
      <Clock className="h-4 w-4 text-primary" />
      <span className="font-mono text-sm font-bold tracking-tight">
        {time.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
};

export default function TradesPage() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [isTrading, setIsTrading] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'history'>('dashboard');
  const [isFixedTime, setIsFixedTime] = useState(true);

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

  const { data: myTrades, isLoading: loadingMyTrades } = useQuery({
    queryKey: ['my-managed-trades'],
    queryFn: async () => {
      const { data, error } = await api.get<any[]>('/managed-trades/my-trades');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const handleTrade = async (direction: 'call' | 'put' = 'call') => {
    if (!selectedTrade || !tradeAmount) return;
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount < selectedTrade.min_stake) {
      toast.error(`Minimum amount is $${selectedTrade.min_stake}`);
      return;
    }

    setIsTrading(true);
    try {
      const { error } = await api.post(`/managed-trades/${selectedTrade.id}/enter`, {
        amount,
        direction
      });
      if (error) throw error;
      toast.success("Trade position opened successfully!");
      setTradeAmount('');
      queryClient.invalidateQueries({ queryKey: ['managed-trades'] });
      queryClient.invalidateQueries({ queryKey: ['trading-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['my-managed-trades'] });
    } catch (err: any) {
      toast.error(err.message || "Failed to open trade");
    } finally {
      setIsTrading(false);
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
              <h1 className="text-xl font-bold tracking-tight">Avent Ridge Trades</h1>
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
              <LayoutDashboard className="h-4 w-4" /> Chart
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
                    <h2 className="text-xl font-bold">No Active Trades</h2>
                    <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                      Our expert traders are currently analyzing the markets. New trades will appear here shortly.
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

                  </>
                )}
              </div>

              {/* RIGHT COLUMN: Execution Panel (Refined to match image) */}
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 sticky top-28">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold">Execution Panel</h3>
                    <DigitalClock />
                  </div>

                  <div className="space-y-5">
                    {/* Option Type */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Option Type</label>
                      <div className="w-full h-12 bg-muted/30 border border-border rounded-xl flex items-center px-4 font-semibold text-sm capitalize">
                        {selectedTrade?.asset_type || 'Loading...'}
                      </div>
                    </div>

                    {/* Asset Type */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Asset Type</label>
                      <AssetSelector
                        selected={selectedTrade ? { symbol: selectedTrade.asset_symbol, type: selectedTrade.asset_type } : null}
                        assets={tradeAssets}
                        onChange={handleAssetChange}
                      />
                    </div>

                    {/* Platform Time & Fixed Time */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Fixed Time</span>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </div>
                      <button
                        onClick={() => setIsFixedTime(!isFixedTime)}
                        className={cn(
                          "w-10 h-5 rounded-full p-1 transition-colors relative",
                          isFixedTime ? "bg-primary" : "bg-muted"
                        )}
                      >
                        <motion.div
                          animate={{ x: isFixedTime ? 20 : 0 }}
                          className="w-3 h-3 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between px-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Amount</label>
                        <span className="text-[10px] font-bold text-primary uppercase">Min: ${selectedTrade?.min_stake || 0}</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold opacity-40">$</span>
                        <input
                          type="number"
                          value={tradeAmount}
                          onChange={(e) => setTradeAmount(e.target.value)}
                          placeholder="1000"
                          className="w-full h-12 pl-10 pr-4 bg-muted/30 border border-border rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* Expiration Time */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Expiration Time</label>
                      <div className="w-full h-12 bg-muted/30 border border-border rounded-xl flex items-center justify-between px-4 font-semibold text-sm">
                        <span>{selectedTrade?.duration || 'N/A'}</span>
                        <Timer className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Profit Display */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 px-1">
                        <TrendingUp className="h-3 w-3 text-success" />
                        <span className="text-[10px] font-bold text-success uppercase">Profit ({selectedTrade?.profit_percent}%)</span>
                      </div>
                      <div className="w-full h-12 bg-success/5 border border-success/20 rounded-xl flex items-center justify-between px-4">
                        <span className="text-lg font-black text-success">
                          ${tradeAmount && !isNaN(parseFloat(tradeAmount))
                            ? (parseFloat(tradeAmount) * (selectedTrade?.profit_percent / 100)).toLocaleString()
                            : '0.00'}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">USD</span>
                      </div>
                    </div>

                    {/* Call / Put Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => handleTrade('call')}
                        disabled={isTrading || !tradeAmount || !selectedTrade}
                        className={cn(
                          "h-12 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg",
                          "bg-success text-white shadow-success/20 hover:opacity-90 disabled:opacity-50"
                        )}
                      >
                        {isTrading ? (
                          <RefreshCcw className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <ArrowUpCircle className="h-5 w-5" /> Call
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleTrade('put')}
                        disabled={isTrading || !tradeAmount || !selectedTrade}
                        className={cn(
                          "h-12 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg",
                          "bg-destructive text-white shadow-destructive/20 hover:opacity-90 disabled:opacity-50"
                        )}
                      >
                        {isTrading ? (
                          <RefreshCcw className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <motion.div animate={{ rotate: 180 }}>
                              <ArrowUpCircle className="h-5 w-5" />
                            </motion.div>
                            Put
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Wallet Balance</p>
                        <p className="font-bold text-sm text-primary">${walletBalance.toLocaleString()}</p>
                      </div>
                      <Wallet className="h-5 w-5 text-primary opacity-50" />
                    </div>
                  </div>
                </div>

                {/* My active positions - mini list */}
                {myTrades && myTrades.filter((s: any) => s.status === 'active').length > 0 && (
                  <div className="bg-card border border-border rounded-3xl p-6">
                    <h4 className="text-sm font-bold mb-4 flex items-center justify-between">
                      My Active Trades
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">
                        {myTrades.filter((s: any) => s.status === 'active').length}
                      </span>
                    </h4>
                    <div className="space-y-3">
                      {myTrades.filter((s: any) => s.status === 'active').slice(0, 3).map((tradeEntry: any) => (
                        <div key={tradeEntry.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/50">
                          <div>
                            <p className="text-xs font-bold">{tradeEntry.managed_trades?.asset_symbol}</p>
                            <p className="text-[10px] text-muted-foreground">${tradeEntry.stake_amount}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-success">+${(tradeEntry.stake_amount * (tradeEntry.managed_trades?.profit_percent / 100)).toFixed(2)}</p>
                            <Timer className="h-3 w-3 text-muted-foreground ml-auto mt-0.5" />
                          </div>
                        </div>
                      ))}
                      {myTrades.filter((s: any) => s.status === 'active').length > 3 && (
                        <button onClick={() => setViewMode('history')} className="w-full py-2 text-[10px] font-bold text-muted-foreground uppercase hover:text-primary transition-colors">
                          View all trades
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
                {/* Active Trades */}
                <div>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Activity className="h-6 w-6 text-primary" /> Active Trades
                  </h2>
                  <div className="space-y-4">
                    {myTrades && myTrades.filter((s: any) => s.status === 'active').length === 0 ? (
                      <div className="p-12 rounded-[2.5rem] border border-dashed border-border flex flex-col items-center justify-center opacity-40">
                        <LayoutDashboard className="h-10 w-10 mb-2" />
                        <p className="text-sm font-bold italic">No active trades</p>
                      </div>
                    ) : myTrades?.filter((s: any) => s.status === 'active').map((tradeEntry: any) => (
                      <div key={tradeEntry.id} className="bg-card border border-border p-6 rounded-4xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <b className="text-primary">{tradeEntry.managed_trades?.asset_symbol.slice(0, 1)}</b>
                          </div>
                          <div>
                            <p className="font-bold uppercase">{tradeEntry.managed_trades?.asset_symbol} ({tradeEntry.direction})</p>
                            <p className="text-xs text-muted-foreground">
                              Amount: ${tradeEntry.stake_amount} • Entry: {tradeEntry.managed_trades?.signal_type} @ {tradeEntry.managed_trades?.entry_price}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Expected Payout</p>
                          <p className="text-xl font-black text-success">
                            ${(tradeEntry.stake_amount * (1 + (tradeEntry.managed_trades?.profit_percent || 0) / 100)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trade History */}
                <div>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <History className="h-6 w-6 text-muted-foreground" /> Trade History
                  </h2>
                  <div className="space-y-3">
                    {myTrades && myTrades.filter((s: any) => s.status !== 'active').length === 0 ? (
                      <div className="p-12 rounded-[2.5rem] border border-dashed border-border flex flex-col items-center justify-center opacity-40">
                        <History className="h-10 w-10 mb-2" />
                        <p className="text-sm font-bold italic">No history available</p>
                      </div>
                    ) : myTrades?.filter((s: any) => s.status !== 'active').map((tradeEntry: any) => (
                      <div key={tradeEntry.id} className="bg-muted/30 border border-border/50 p-5 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {tradeEntry.status === 'paid_out' ? <CheckCircle className="h-5 w-5 text-success" /> : <X className="h-5 w-5 text-destructive" />}
                          <div>
                            <p className="text-sm font-bold uppercase">{tradeEntry.managed_trades?.asset_symbol} ({tradeEntry.direction}) - {tradeEntry.status === 'paid_out' ? 'Settled' : 'Lost'}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">{format(new Date(tradeEntry.created_at), 'MMM dd, yyyy')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-sm font-black", tradeEntry.status === 'paid_out' ? "text-success" : "text-destructive")}>
                            {tradeEntry.status === 'paid_out' ? `+$${(tradeEntry.stake_amount * (1 + (tradeEntry.managed_trades?.profit_percent || 0) / 100)).toLocaleString()}` : `$0.00`}
                          </p>
                          <span className="text-[10px] text-muted-foreground font-bold">Amount: ${tradeEntry.stake_amount}</span>
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
