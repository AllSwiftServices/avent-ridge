"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Clock, TrendingUp, AlertCircle, CheckCircle,
  RefreshCcw, ArrowRight, ShieldCheck, X, Activity,
  LineChart, LayoutDashboard, History, Wallet,
  ArrowUpCircle, Info, Timer, Target, ChevronDown
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from '@/lib/react-router-shim';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import AssetSelector from '@/components/trading/AssetSelector';
import CandlestickChart from '@/components/trading/CandlestickChart';
import LivePriceHeader from '@/components/trading/LivePriceHeader';

const OPTION_TYPES = ['Commodities', 'Crypto', 'Forex', 'Indices', 'Stocks'];
const ASSETS_BY_TYPE: Record<string, string[]> = {
  'Commodities': ['Gold', 'Silver', 'Crude Oil Brent', 'Crude Oil WTI', 'Natural Gas', 'Corn', 'Wheat', 'Copper'],
  'Crypto': ['Bitcoin', 'Ethereum', 'Solana', 'XRP', 'Cardano', 'Dogecoin', 'Polkadot'],
  'Forex': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'EUR/GBP'],
  'Indices': ['S&P 500', 'Nasdaq 100', 'Dow Jones', 'FTSE 100', 'DAX 40'],
  'Stocks': ['Apple', 'Microsoft', 'Tesla', 'Amazon', 'Google', 'Meta'],
};
const DURATIONS = [
  { label: '30 Seconds', value: '30s' },
  { label: '1 Minute', value: '1m' },
  { label: '5 Minutes', value: '5m' },
  { label: '15 Minutes', value: '15m' },
  { label: '30 Minutes', value: '30m' },
  { label: '1 Hour', value: '1h' },
];

const CountdownTimer = ({ endsAt, onExpire, tradeId }: { endsAt: string, onExpire?: () => void, tradeId?: string }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endsAt).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft('Finalizing...');
        if (!isExpired) {
          setIsExpired(true);
          onExpire?.();
          
          if (tradeId) {
            api.post('/managed-trades/process-expired', { tradeId }).then(() => {
              queryClient.invalidateQueries({ queryKey: ['managed-trades'] });
              queryClient.invalidateQueries({ queryKey: ['trading-wallet'] });
              queryClient.invalidateQueries({ queryKey: ['my-managed-trades'] });
            }).catch(err => console.error("Auto-payout trigger failed:", err));
          }
        }
        return;
      }

      setIsExpired(false);
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const parts = [];
      if (hours > 0) parts.push(hours.toString().padStart(2, '0'));
      parts.push(minutes.toString().padStart(2, '0'));
      parts.push(seconds.toString().padStart(2, '0'));
      
      setTimeLeft(parts.join(':'));
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endsAt, onExpire, isExpired, tradeId, queryClient]);

  return <span className={cn(isExpired ? "text-muted-foreground animate-pulse" : "font-mono font-bold")}>{timeLeft}</span>;
};

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

interface LiveTradingViewProps {
  onViewChange?: (view: 'ai' | 'live') => void;
}

export default function LiveTradingView({ onViewChange }: LiveTradingViewProps) {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [isTrading, setIsTrading] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'history'>('dashboard');
  const [isFixedTime, setIsFixedTime] = useState(true);
  const [selectedExpired, setSelectedExpired] = useState(false);

  // Filter state for selection
  const [selOptionType, setSelOptionType] = useState<string>('Crypto');
  const [selAssetId, setSelAssetId] = useState<string>('Bitcoin');
  const [selDuration, setSelDuration] = useState<string>('5m');

  // Browsing asset (used for chart when no active trade matches)
  const [browseAsset, setBrowseAsset] = useState<any>({ symbol: 'BTC', name: 'Bitcoin', type: 'crypto' });

  // Live price simulation for browsing
  const [livePrice, setLivePrice] = useState<number>(0);
  const prevPriceRef = useRef<number>(0);
  const [prevPrice, setPrevPrice] = useState<number>(0);
  const [changePercent, setChangePercent] = useState(0);

  useEffect(() => {
    if (!isLoadingAuth && !user) navigate(createPageUrl('Home'));
  }, [user, isLoadingAuth, navigate]);

  // Fetch ALL assets from DB for browsing
  const { data: allAssets } = useQuery({
    queryKey: ['all-assets'],
    queryFn: async () => {
      const { data, error } = await api.get<any[]>('/assets');
      if (error) throw error;
      return data;
    }
  });

  const { data: trades, isLoading: loadingTrades } = useQuery({
    queryKey: ['managed-trades'],
    queryFn: async () => {
      const { data, error } = await api.get<any[]>('/managed-trades');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const activeTrades = useMemo(() => {
    if (!trades) return [];
    const now = Date.now();
    return trades.filter(t => t.status === 'active' && new Date(t.ends_at).getTime() > now);
  }, [trades]);

  // Build the browsable asset list: all DB assets
  const browseAssets = useMemo(() => {
    if (!allAssets) return [];
    return allAssets.map((a: any) => ({
      symbol: a.symbol,
      name: a.name,
      type: a.asset_type || a.type || 'crypto',
      price: a.price,
      change_percent: a.change_percent,
    }));
  }, [allAssets]);

  // Initialize price when asset changes
  useEffect(() => {
    const dbAsset = allAssets?.find((a: any) => a.symbol === browseAsset.symbol);
    const basePrice = dbAsset?.price ?? 100;
    const baseChange = dbAsset?.change_percent ?? 0;
    setLivePrice(basePrice);
    setPrevPrice(basePrice);
    prevPriceRef.current = basePrice;
    setChangePercent(baseChange);
  }, [browseAsset.symbol, allAssets]);

  // Simulate live price ticking
  useEffect(() => {
    if (!livePrice) return;
    const volatility = browseAsset.type === 'crypto' ? 0.0015 : 0.0005;
    const interval = setInterval(() => {
      setLivePrice(prev => {
        if (!prev) return prev;
        const change = (Math.random() - 0.49) * prev * volatility;
        const next = Math.max(prev * 0.95, prev + change);
        setPrevPrice(prevPriceRef.current);
        prevPriceRef.current = prev;
        return next;
      });
    }, 1000 + Math.random() * 500);
    return () => clearInterval(interval);
  }, [livePrice, browseAsset.type]);

  // Derive dynamic options from active signals
  const availableOptionTypes = useMemo(() => {
    const types = new Set(activeTrades.map(t => t.asset_type.charAt(0).toUpperCase() + t.asset_type.slice(1)));
    return Array.from(types).sort();
  }, [activeTrades]);

  const availableAssetsByType = useMemo(() => {
    const map: Record<string, string[]> = {};
    activeTrades.forEach(t => {
      const type = t.asset_type.charAt(0).toUpperCase() + t.asset_type.slice(1);
      if (!map[type]) map[type] = [];
      if (!map[type].includes(t.asset_name)) map[type].push(t.asset_name);
    });
    return map;
  }, [activeTrades]);

  const availableDurations = useMemo(() => {
    const durations = activeTrades
      .filter(t => 
        (t.asset_type.toLowerCase() === selOptionType.toLowerCase()) && 
        (t.asset_name === selAssetId)
      )
      .map(t => t.duration);
    return Array.from(new Set(durations));
  }, [activeTrades, selOptionType, selAssetId]);

  // Sync selection with active trades
  useEffect(() => {
    if (!trades) return;
    
    const matchingTrade = trades.find(t => 
      t.status === 'active' && 
      t.asset_type?.toLowerCase() === selOptionType?.toLowerCase() &&
      (t.asset_name?.toLowerCase() === selAssetId?.toLowerCase() || t.asset_symbol?.toLowerCase() === selAssetId?.toLowerCase()) &&
      t.duration === selDuration
    );

    if (matchingTrade) {
      setSelectedTrade(matchingTrade);
      setSelectedExpired(false);
    } else {
      setSelectedTrade(null);
    }
  }, [trades, selOptionType, selAssetId, selDuration]);

  // Auto-selection refinements for dynamic transitions
  useEffect(() => {
    if (activeTrades.length === 0) return;

    if (availableOptionTypes.length > 0 && !availableOptionTypes.includes(selOptionType)) {
      const firstType = availableOptionTypes[0];
      setSelOptionType(firstType);
      const firstAsset = availableAssetsByType[firstType]?.[0];
      if (firstAsset) setSelAssetId(firstAsset);
      return;
    }

    const validAssetsForType = availableAssetsByType[selOptionType] || [];
    if (validAssetsForType.length > 0 && !validAssetsForType.includes(selAssetId)) {
      setSelAssetId(validAssetsForType[0]);
      return;
    }

    if (availableDurations.length > 0 && !availableDurations.includes(selDuration)) {
      setSelDuration(availableDurations[0]);
    }
  }, [activeTrades, availableOptionTypes, availableAssetsByType, availableDurations, selOptionType, selAssetId, selDuration]);

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
      <div className="flex-1 bg-background flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // For the asset selector: merge DB assets with trade-specific assets
  const tradeAssets = activeTrades.map(t => ({
    symbol: t.asset_symbol,
    name: t.asset_name,
    type: t.asset_type,
    tradeId: t.id,
    ...t
  }));

  const handleAssetChange = (asset: any) => {
    // Update browsing asset for chart
    setBrowseAsset({ symbol: asset.symbol, name: asset.name, type: asset.type || asset.asset_type || 'crypto' });
    // Also attempt to match to an active trade
    if (asset.asset_type) {
      setSelOptionType(asset.asset_type.charAt(0).toUpperCase() + asset.asset_type.slice(1));
      setSelAssetId(asset.asset_name || asset.name);
      if (asset.duration) setSelDuration(asset.duration);
    }
  };

  const walletBalance = Number(wallet?.main_balance || 0);

  // Determine chart display price: from selected trade or from live price simulation
  const chartBasePrice = selectedTrade?.entry_price || livePrice || 100;
  const chartIsPositive = selectedTrade ? selectedTrade.signal_type === 'call' : changePercent >= 0;
  const hasActiveTrade = !!selectedTrade;

  return (
    <div className="bg-background text-foreground pb-24 lg:pb-8 flex flex-col">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Live Trading</h1>
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
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-[2.5rem] p-6 lg:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="space-y-1">
                      <AssetSelector
                        selected={browseAsset}
                        assets={browseAssets.length > 0 ? browseAssets : tradeAssets}
                        onChange={handleAssetChange}
                      />
                      <p className="text-sm text-muted-foreground px-1">
                        {browseAsset.name}
                        {hasActiveTrade && <span className="ml-1 text-primary">• Active Signal</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      {hasActiveTrade ? (
                        <>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Profit Target</p>
                            <span className="text-2xl font-black text-success">+{selectedTrade?.profit_percent}%</span>
                          </div>
                          <div className="h-10 w-px bg-border hidden md:block" />
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Ends In</p>
                            <span className="text-lg flex items-center justify-end">
                              <CountdownTimer 
                                key={selectedTrade.id} 
                                endsAt={selectedTrade.ends_at} 
                                onExpire={() => setSelectedExpired(true)} 
                                tradeId={selectedTrade.id}
                              />
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Price</p>
                          <span className="text-2xl font-black">
                            ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-3xl bg-muted/30 border border-border p-4">
                    <CandlestickChart
                      basePrice={chartBasePrice}
                      isPositive={chartIsPositive}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 sticky top-28">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold">Execution Panel</h3>
                    <DigitalClock />
                  </div>

                  <div className="space-y-5">
                    {!hasActiveTrade ? (
                      <div className="p-6 rounded-2xl bg-muted/30 border border-dashed border-border text-center">
                        <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm font-bold">No Active Signal</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto">
                          There are no active managed trades for <span className="font-bold text-foreground">{browseAsset.name}</span> right now. Browse the chart above or check back soon.
                        </p>
                      </div>
                    ) : (
                      <>
                    <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Asset</span>
                        <span className="text-sm font-bold">{selectedTrade.asset_symbol} — {selectedTrade.asset_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Signal</span>
                        <span className={cn(
                          "text-sm font-bold uppercase px-2 py-0.5 rounded-lg",
                          selectedTrade.signal_type === 'call' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                        )}>
                          {selectedTrade.signal_type === 'call' ? '▲ Call' : '▼ Put'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Expires</span>
                        <span className="text-sm font-mono font-bold text-primary">
                          <CountdownTimer key={`info-${selectedTrade.id}`} endsAt={selectedTrade.ends_at} onExpire={() => setSelectedExpired(true)} />
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Profit</span>
                        <span className="text-sm font-bold text-success">+{selectedTrade.profit_percent}%</span>
                      </div>
                    </div>

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

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Expiration Time</label>
                      <div className="relative">
                        <select
                          value={selDuration}
                          onChange={(e) => setSelDuration(e.target.value)}
                          className="w-full h-12 bg-muted/30 border border-border rounded-xl px-4 font-semibold text-sm appearance-none outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="">Select Duration</option>
                          {availableDurations.map(d => {
                            const meta = DURATIONS.find(dm => dm.value === d);
                            return <option key={d} value={d}>{meta?.label || d}</option>;
                          })}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

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

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => handleTrade('call')}
                        disabled={isTrading || !tradeAmount || !selectedTrade || selectedExpired}
                        className={cn(
                          "h-12 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg",
                          "bg-success text-white shadow-success/20 hover:opacity-90 disabled:opacity-50"
                        )}
                      >
                        {isTrading ? (
                          <RefreshCcw className="h-4 w-4 animate-spin" />
                        ) : selectedExpired ? (
                          "Expired"
                        ) : (
                          <>
                            <ArrowUpCircle className="h-5 w-5" /> Call
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleTrade('put')}
                        disabled={isTrading || !tradeAmount || !selectedTrade || selectedExpired}
                        className={cn(
                          "h-12 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg",
                          "bg-destructive text-white shadow-destructive/20 hover:opacity-90 disabled:opacity-50"
                        )}
                      >
                        {isTrading ? (
                          <RefreshCcw className="h-4 w-4 animate-spin" />
                        ) : selectedExpired ? (
                          "Expired"
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
                      </>
                    )}
                  </div>
                </div>

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
                            <b className="text-primary">{tradeEntry.managed_trades?.asset_symbol?.slice(0, 1)}</b>
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
