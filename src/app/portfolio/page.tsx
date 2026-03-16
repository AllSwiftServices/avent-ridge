"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import AnimatedNumber from '@/components/common/AnimatedNumber';
import { api } from '@/lib/api';
import { useNavigate } from '@/lib/react-router-shim';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import AllocationChart from '@/components/portfolio/AllocationChart';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';

interface PortfolioItemProps {
  item: any;
  currentPrice: number;
  index: number;
}

function PortfolioItem({ item, currentPrice, index }: PortfolioItemProps) {
  const profitLoss = (currentPrice - item.avg_buy_price) * item.quantity;
  const profitLossPercent = ((currentPrice - item.avg_buy_price) / item.avg_buy_price) * 100;
  const isPositive = profitLoss >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-4 rounded-2xl bg-card border border-border flex items-center gap-4"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
        {item.asset_symbol.slice(0, 2)}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{item.asset_symbol}</p>
        <p className="text-xs text-muted-foreground">{item.quantity} units</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-sm">${(item.quantity * currentPrice).toLocaleString()}</p>
        <p className={cn("text-xs font-medium", isPositive ? "text-primary" : "text-destructive")}>
          {isPositive ? '+' : ''}{profitLossPercent.toFixed(2)}%
        </p>
      </div>
    </motion.div>
  );
}

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('all');
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      navigate(createPageUrl('Home'));
    }
  }, [user, isLoadingAuth, navigate]);

  const { data: assets } = useQuery({
    queryKey: ['portfolio-assets'],
    queryFn: async () => {
      const { data, error } = await api.get<any[]>('/assets');
      if (error) throw error;
      return data;
    }
  });

  const { data: portfolio, isLoading, refetch: refetchPortfolio } = useQuery({
    queryKey: ['portfolio-items'],
    queryFn: async () => {
      const { data, error } = await api.get<any[]>('/portfolio');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Calculate portfolio metrics
  const calculateMetrics = () => {
    if (!portfolio || !assets) return { totalValue: 0, totalInvested: 0, profitLoss: 0, profitLossPercent: 0 };

    let totalValue = 0;
    let totalInvested = 0;

    portfolio.forEach((holding: any) => {
      const asset = assets.find((a: any) => a.symbol === holding.asset_symbol);
      const currentPrice = asset?.price || holding.avg_buy_price;
      totalValue += holding.quantity * currentPrice;
      totalInvested += holding.total_invested || 0;
    });

    return {
      totalValue,
      totalInvested,
      profitLoss: totalValue - totalInvested,
      profitLossPercent: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0
    };
  };

  const metrics = calculateMetrics();
  const isPositive = metrics.profitLoss >= 0;

  // Filter portfolio by type
  const filteredPortfolio = portfolio?.filter((item: any) => {
    if (activeTab === 'all') return true;
    return item.asset_type === activeTab;
  }) || [];

  // Prepare allocation data for chart
  const allocationData = portfolio?.map((item: any) => {
    const asset = assets?.find((a: any) => a.symbol === item.asset_symbol);
    const currentPrice = asset?.price || item.avg_buy_price;
    return {
      name: item.asset_symbol,
      value: item.quantity * currentPrice
    };
  }) || [];

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'stock', label: 'Stocks' },
    { id: 'crypto', label: 'Crypto' },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b bg-background/95 border-border">
        <div className="px-4 py-4">
          <h1 className="font-bold text-2xl">Portfolio</h1>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Portfolio Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-card border border-border"
        >
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground mb-1">Total Portfolio Value</p>
            <AnimatedNumber
              value={metrics.totalValue}
              prefix="$"
              decimals={2}
              className="text-4xl font-bold"
            />
            <div className="flex items-center justify-center gap-1 mt-2 font-medium" style={{ color: isPositive ? 'var(--color-primary)' : 'var(--color-destructive)' }}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {isPositive ? '+' : ''}{metrics.profitLossPercent.toFixed(2)}%
                ({isPositive ? '+' : ''}${Math.abs(metrics.profitLoss).toFixed(2)})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Total Invested</p>
              <p className="text-lg font-semibold">
                ${metrics.totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className={cn("p-4 rounded-2xl", isPositive ? "bg-primary/10" : "bg-destructive/10")}>
              <p className="text-xs text-muted-foreground mb-1">Profit/Loss</p>
              <p className={cn("text-lg font-semibold", isPositive ? "text-primary" : "text-destructive")}>
                {isPositive ? '+' : ''}${metrics.profitLoss.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Allocation Chart */}
        {allocationData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-3xl bg-card border border-border"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Allocation</h3>
            </div>
            <AllocationChart data={allocationData} />
          </motion.div>
        )}

        {/* Holdings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Holdings</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetchPortfolio()}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                title="Refresh holdings"
              >
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </button>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : filteredPortfolio.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-3xl border border-border">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No holdings yet</p>
              <p className="text-sm text-muted-foreground">
                Start trading to build your portfolio
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPortfolio.map((item: any, index: number) => {
                const asset = assets?.find((a: any) => a.symbol === item.asset_symbol);
                return (
                  <PortfolioItem
                    key={item.id}
                    item={item}
                    currentPrice={asset?.price || item.avg_buy_price}
                    index={index}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}