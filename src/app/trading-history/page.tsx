"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, Search, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';

const TYPE_CONFIG: any = {
  buy: { label: 'Buy', icon: ArrowDownLeft, color: '#FFC107', bg: 'rgba(255,193,7,0.1)' },
  sell: { label: 'Sell', icon: ArrowUpRight, color: '#E53935', bg: 'rgba(229,57,53,0.1)' },
  deposit: { label: 'Deposit', icon: ArrowDownLeft, color: '#FFC107', bg: 'rgba(255,193,7,0.1)' },
  withdraw: { label: 'Withdraw', icon: ArrowUpRight, color: '#E53935', bg: 'rgba(229,57,53,0.1)' },
};

const TABS = ['all', 'buy', 'sell', 'deposit', 'withdraw'];

export default function TradingHistory() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const filtered = (transactions || []).filter((tx: any) => {
    const matchTab = activeTab === 'all' || tx.type === activeTab;
    const matchSearch = !search ||
      tx.asset_symbol?.toLowerCase().includes(search.toLowerCase()) ||
      tx.type?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalBuys = (transactions || []).filter((t: any) => t.type === 'buy').reduce((s: number, t: any) => s + (t.amount || 0), 0);
  const totalSells = (transactions || []).filter((t: any) => t.type === 'sell').reduce((s: number, t: any) => s + (t.amount || 0), 0);
  const totalDeposits = (transactions || []).filter((t: any) => t.type === 'deposit').reduce((s: number, t: any) => s + (t.amount || 0), 0);

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: '#F5F6FA', color: '#1A1A2E' }}>
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b px-4 py-4" style={{ background: 'rgba(245,246,250,0.95)', borderColor: '#E0E0E8' }}>
        <h1 className="font-bold text-2xl mb-4" style={{ color: '#1A1A2E' }}>Trading History</h1>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Search by asset or type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-[#FFC107] transition-colors"
            style={{ background: '#fff', borderColor: '#E0E0E8', color: '#1A1A2E' }}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all"
              style={activeTab === tab ? { background: '#FFC107', color: '#000' } : { background: '#E8E9EE', color: '#6B7280' }}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Bought', value: totalBuys, color: '#FFC107' },
            { label: 'Total Sold', value: totalSells, color: '#E53935' },
            { label: 'Deposited', value: totalDeposits, color: '#FFC107' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-3 border text-center" style={{ background: '#fff', borderColor: '#E0E0E8' }}>
              <p className="text-[10px] text-[#9CA3AF] font-medium mb-1">{label}</p>
              <p className="text-sm font-bold" style={{ color }}>${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          ))}
        </div>

        {/* Transaction List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 rounded-full border-2 border-[#FFC107] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-3xl border" style={{ background: '#fff', borderColor: '#E0E0E8' }}>
            <Filter className="h-10 w-10 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
            <p className="text-[#9CA3AF] font-medium">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((tx: any, i: number) => {
              const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.buy;
              const Icon = cfg.icon;
              const isIncome = tx.type === 'buy' || tx.type === 'deposit';
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between p-4 rounded-2xl border"
                  style={{ background: '#fff', borderColor: '#E0E0E8' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                      <Icon className="h-5 w-5" style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm capitalize" style={{ color: '#1A1A2E' }}>
                        {cfg.label}{tx.asset_symbol ? ` ${tx.asset_symbol}` : ''}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>
                          {tx.created_at ? format(new Date(tx.created_at), 'MMM d, yyyy · h:mm a') : '—'}
                        </p>
                        {tx.quantity && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono" style={{ background: '#F5F6FA', color: '#6B7280' }}>
                            {tx.quantity} units
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm" style={{ color: isIncome ? '#FFC107' : '#E53935' }}>
                      {isIncome ? '+' : '-'}${tx.amount?.toFixed(2)}
                    </p>
                    {tx.price_at_transaction && (
                      <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>
                        @ ${tx.price_at_transaction?.toFixed(2)}
                      </p>
                    )}
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 inline-block capitalize')}
                      style={{
                        background: tx.status === 'completed' ? 'rgba(255,193,7,0.1)' : tx.status === 'failed' ? 'rgba(229,57,53,0.1)' : 'rgba(156,163,175,0.1)',
                        color: tx.status === 'completed' ? '#FFC107' : tx.status === 'failed' ? '#E53935' : '#9CA3AF'
                      }}>
                      {tx.status || 'completed'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}