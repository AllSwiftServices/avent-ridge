"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import PortfolioItem from '@/components/portfolio/PortfolioItem';
import AllocationChart from '@/components/portfolio/AllocationChart';
import AnimatedNumber from '@/components/common/AnimatedNumber';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('all');

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('assets').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data, error } = await supabase.from('portfolio').select('*');
      if (error) throw error;
      return data;
    },
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
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: '#F5F6FA', color: '#1A1A2E' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b" style={{ background: 'rgba(245,246,250,0.95)', borderColor: '#E0E0E8' }}>
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
            <div className="flex items-center justify-center gap-1 mt-2" style={{ color: isPositive ? '#FFC107' : '#E53935' }}>
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
            <div className="p-4 rounded-2xl" style={{ background: isPositive ? 'rgba(255,193,7,0.08)' : 'rgba(229,57,53,0.08)' }}>
              <p className="text-xs text-muted-foreground mb-1">Profit/Loss</p>
              <p className="text-lg font-semibold" style={{ color: isPositive ? '#FFC107' : '#E53935' }}>
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
            <div className="flex gap-2">
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