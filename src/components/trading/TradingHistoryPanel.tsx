import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';

const TABS = [
  { key: 'positions', label: 'Positions' },
  { key: 'orders', label: 'Orders' },
  { key: 'deals', label: 'Deals' },
];

export default function TradingHistoryPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('positions');
  const [search, setSearch] = useState('');
  const { theme } = useTheme();
  const { user } = useAuth();
  const dark = theme === 'dark';

  // theme tokens
  const bg = dark ? '#0F1117' : '#F5F6FA';
  const surface = dark ? '#181B23' : '#FFFFFF';
  const border = dark ? 'rgba(255,255,255,0.08)' : '#E0E0E8';
  const textPri = dark ? '#F9FAFB' : '#1A1A2E';
  const textSec = dark ? '#9CA3AF' : '#6B7280';

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!user,
  });

  const txList = transactions || [];

  // Summary numbers
  const profit = txList.filter((t: any) => t.type === 'sell').reduce((s: number, t: any) => s + (t.amount || 0), 0)
    - txList.filter((t: any) => t.type === 'buy').reduce((s: number, t: any) => s + (t.amount || 0), 0);
  const deposit = txList.filter((t: any) => t.type === 'deposit').reduce((s: number, t: any) => s + (t.amount || 0), 0);
  const balance = deposit + profit;

  // Filter list by tab and search
  const typeMap: Record<string, string[]> = { positions: ['buy', 'sell'], orders: ['buy', 'sell'], deals: ['deposit', 'withdraw'] };
  const types = typeMap[activeTab] || ['buy', 'sell'];
  const filtered = txList.filter((tx: any) => {
    const matchType = types.includes(tx.type);
    const matchSearch = !search || tx.asset_symbol?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed inset-x-0 bottom-0 top-0 z-50 flex flex-col md:top-4 md:left-4 md:right-4 md:bottom-4 md:rounded-2xl overflow-hidden"
            style={{ background: bg, color: textPri }}
          >
            {/* ── HEADER ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: border, background: surface }}>
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-base" style={{ color: textPri }}>History</h2>
                {/* search */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: dark ? 'rgba(255,255,255,0.07)' : '#EAECF0' }}>
                  <Search className="h-3.5 w-3.5" style={{ color: textSec }} />
                  <input
                    type="text"
                    placeholder="All symbols"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-transparent focus:outline-none w-24 text-xs"
                    style={{ color: textPri }}
                  />
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl transition-colors" style={{ color: textSec }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* ── TABS ── */}
            <div className="flex border-b shrink-0" style={{ borderColor: border, background: surface }}>
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className="flex-1 py-3 text-sm font-semibold transition-all border-b-2"
                  style={activeTab === t.key
                    ? { color: '#FFC107', borderColor: '#FFC107' }
                    : { color: textSec, borderColor: 'transparent' }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── SUMMARY ROW ── */}
            <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: border, background: surface }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: textSec }}>Profit:</span>
                <span className="font-bold" style={{ color: profit >= 0 ? '#10B981' : '#EF4444' }}>
                  {profit >= 0 ? '+' : ''}{profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span style={{ color: textSec }}>Deposit:</span>
                <span className="font-bold" style={{ color: textPri }}>
                  {deposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1 pt-1 border-t" style={{ borderColor: border }}>
                <span className="font-semibold" style={{ color: textSec }}>Balance:</span>
                <span className="font-bold text-base" style={{ color: '#FFC107' }}>
                  {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* ── TRANSACTION LIST ── */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin h-7 w-7 rounded-full border-2 border-[#FFC107] border-t-transparent" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <TrendingUp className="h-10 w-10" style={{ color: dark ? '#374151' : '#D1D5DB' }} />
                  <p className="text-sm" style={{ color: textSec }}>No transactions found</p>
                </div>
              ) : (
                filtered.map((tx: any, i: number) => {
                  const isBuy = tx.type === 'buy';
                  const isDeposit = tx.type === 'deposit';
                  const isProfit = isBuy || isDeposit;
                  const pnlColor = isProfit ? '#10B981' : '#EF4444';
                  const sideColor = isBuy ? '#10B981' : '#EF4444';

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b"
                      style={{ borderColor: border, background: i % 2 === 0 ? surface : bg }}
                    >
                      {/* Row top: symbol + side + qty → price movement */}
                      <div className="flex items-start justify-between px-4 pt-3 pb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm" style={{ color: textPri }}>
                            {tx.asset_symbol || tx.type}
                          </span>
                          <span className="text-xs font-bold uppercase" style={{ color: sideColor }}>
                            {tx.type === 'buy' ? 'buy' : tx.type === 'sell' ? 'sell' : tx.type}
                            {tx.quantity ? ` ${tx.quantity}` : ''}
                          </span>
                        </div>
                        <span className="font-bold text-sm" style={{ color: pnlColor }}>
                          {isProfit ? '+' : '-'}{tx.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
                        </span>
                      </div>

                      {/* Row bottom: date + price details */}
                      <div className="flex items-center justify-between px-4 pb-3">
                        <span className="text-xs" style={{ color: textSec }}>
                          {tx.created_at ? format(new Date(tx.created_at), 'yyyy.MM.dd HH:mm:ss') : '—'}
                        </span>
                        {tx.price_at_transaction ? (
                          <span className="text-xs font-mono" style={{ color: textSec }}>
                            @ ${tx.price_at_transaction.toLocaleString('en-US', { minimumFractionDigits: 4 })}
                          </span>
                        ) : null}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}