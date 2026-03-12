"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, TrendingUp, Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import AssetCard from '@/components/market/AssetCard';
import TradeModal from '@/components/trade/TradeModal';
import { AssetListSkeleton } from '@/components/common/LoadingSkeleton';
import { useAuth } from '@/lib/AuthContext';

export default function Markets() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const { user } = useAuth();

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('assets').select('*');
      if (error) throw error;
      return data;
    },
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

  const { data: portfolio, refetch: refetchPortfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data, error } = await supabase.from('portfolio').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Check URL for asset param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const assetSymbol = params.get('asset');
    if (assetSymbol && assets) {
      const asset = assets.find((a: any) => a.symbol === assetSymbol);
      if (asset) {
        setSelectedAsset(asset);
        setIsTradeModalOpen(true);
      }
    }
  }, [assets]);

  const tabs = [
    { id: 'all', label: 'All', icon: null },
    { id: 'stock', label: 'Stocks', icon: TrendingUp },
    { id: 'crypto', label: 'Crypto', icon: null },
    { id: 'trending', label: 'Trending', icon: Flame },
  ];

  const filteredAssets = assets?.filter((asset: any) => {
    const matchesSearch =
      asset.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'trending') return matchesSearch && Math.abs(asset.change_percent) > 2;
    return matchesSearch && asset.type === activeTab;
  }) || [];

  const wallet = wallets?.[0] || { main_balance: 10000 };

  const handleTrade = async (trade: any) => {
    // In a real app, you would process the trade here
    console.log('Trade executed:', trade);
    refetchPortfolio();
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b bg-background/95 border-border">
        <div className="px-4 py-4">
          <h1 className="font-bold text-2xl mb-4">Markets</h1>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-2xl"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
            {tabs.map((tab: any) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                  'flex items-center gap-1.5',
                  activeTab === tab.id
                    ? 'font-semibold bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.icon && <tab.icon className="h-4 w-4" />}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Asset List */}
      <div className="px-4 py-4">
        {isLoading ? (
          <AssetListSkeleton />
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No assets found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAssets.map((asset: any, index: number) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                index={index}
                onClick={() => {
                  setSelectedAsset(asset);
                  setIsTradeModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trade Modal */}
      <TradeModal
        asset={selectedAsset}
        isOpen={isTradeModalOpen}
        onClose={() => {
          setIsTradeModalOpen(false);
          setSelectedAsset(null);
        }}
        onTrade={handleTrade}
        balance={wallet.main_balance || 10000}
      />
    </div>
  );
}