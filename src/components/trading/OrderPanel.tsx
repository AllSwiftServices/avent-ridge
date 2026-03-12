import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';

const DURATIONS = [
  { label: '30 secs', value: 30 },
  { label: '1 min', value: 60 },
  { label: '5 mins', value: 300 },
  { label: '10 mins', value: 600 },
  { label: '20 mins', value: 1200 },
  { label: '30 mins', value: 1800 },
  { label: '1 hour', value: 3600 },
  { label: '2 hour', value: 7200 },
];

const OPTION_TYPES = ['High / Low', 'Touch / No Touch', 'In / Out'];
const PROFIT_RATE = 0.85; // 85% profit

export default function OrderPanel({ asset, price, balance: balanceProp = 12500 }: any) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dark = theme === 'dark';

  const bg = dark ? '#0F1117' : '#F5F6FA';
  const surface = dark ? '#181B23' : '#FFFFFF';
  const border = dark ? 'rgba(255,255,255,0.08)' : '#E0E0E8';
  const textPri = dark ? '#F9FAFB' : '#1A1A2E';
  const textSec = dark ? '#9CA3AF' : '#6B7280';
  const inputBg = dark ? '#1E2130' : '#EAECF0';

  const [optionType, setOptionType] = useState(OPTION_TYPES[0]);
  const [optionOpen, setOptionOpen] = useState(false);
  const [amount, setAmount] = useState(100);
  const [duration, setDuration] = useState(60);
  const [step, setStep] = useState('input'); // input | success
  const [lastSide, setLastSide] = useState('call');

  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('wallets').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const balance = wallets?.[0]?.main_balance ?? balanceProp;

  const { data: transactions } = useQuery({
    queryKey: ['transactions-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const potentialProfit = +(amount * PROFIT_RATE).toFixed(2);

  const handleTrade = async (side: 'call' | 'put') => {
    if (amount <= 0 || amount > balance || !user) return;
    setLastSide(side);
    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: side === 'call' ? 'buy' : 'sell',
        asset_symbol: asset?.symbol,
        amount,
        price_at_transaction: price,
        quantity: +(amount / price).toFixed(6),
        status: 'completed',
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['transactions-all'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });

      setStep('success');
      setTimeout(() => setStep('input'), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ background: bg, color: textPri }}>
      {/* ── PLATFORM TIME BAR ── */}
      <div className="flex items-center justify-between px-4 py-2 text-xs border-b" style={{ borderColor: border, color: textSec }}>
        <div className="flex items-center gap-2">
          <span>Platform Time</span>
          <span className="font-mono font-semibold" style={{ color: textPri }}>
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Fixed Time</span>
          <div className="w-8 h-4 rounded-full relative" style={{ background: '#E0E0E8' }}>
            <div className="w-3 h-3 rounded-full absolute top-0.5 left-0.5" style={{ background: '#9CA3AF' }} />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* ── OPTION TYPE SELECT ── */}
        <div className="relative">
          <button
            onClick={() => setOptionOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm"
            style={{ background: inputBg, color: textSec }}
          >
            <span>{optionType}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {optionOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="absolute left-0 right-0 top-full mt-1 rounded-xl shadow-xl z-20 overflow-hidden"
                style={{ background: surface, border: `1px solid ${border}` }}
              >
                {OPTION_TYPES.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setOptionType(opt); setOptionOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm hover:opacity-80 transition-opacity border-b last:border-0"
                    style={{ borderColor: border, color: opt === optionType ? '#FFC107' : textPri }}
                  >
                    {opt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── ASSET TYPE (display only) ── */}
        <div
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm"
          style={{ background: inputBg, color: textSec }}
        >
          <span>{asset?.name || asset?.symbol || 'Select asset'}</span>
          <ChevronDown className="h-4 w-4" />
        </div>

        {/* ── AMOUNT INPUT ── */}
        <div className="flex items-center rounded-xl overflow-hidden" style={{ background: inputBg }}>
          <button
            onClick={() => setAmount(a => Math.max(1, a - (a >= 100 ? 10 : 1)))}
            className="px-4 py-3 hover:opacity-70 transition-opacity"
            style={{ color: textSec }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(Math.max(1, Number(e.target.value)))}
            className="flex-1 text-center bg-transparent text-sm font-semibold focus:outline-none"
            style={{ color: textPri }}
          />
          <button
            onClick={() => setAmount(a => a + (a >= 100 ? 10 : 1))}
            className="px-4 py-3 hover:opacity-70 transition-opacity"
            style={{ color: textSec }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* ── POTENTIAL PROFIT ── */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <span className="text-sm" style={{ color: '#10B981' }}>Potential Profit</span>
          <span className="font-bold text-sm" style={{ color: '#10B981' }}>
            + ${potentialProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* ── DURATION PILLS ── */}
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map(d => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
              className="py-2 rounded-xl text-xs font-semibold transition-all"
              style={duration === d.value
                ? { background: '#FFC107', color: '#000' }
                : { background: inputBg, color: textSec }}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* ── CALL / PUT BUTTONS ── */}
        <AnimatePresence mode="wait">
          {step === 'success' ? (
            <motion.div
              key="success"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-4 gap-2"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: lastSide === 'call' ? '#10B981' : '#EF4444' }}>
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <p className="font-bold text-sm" style={{ color: textPri }}>
                {lastSide === 'call' ? 'Call' : 'Put'} order placed!
              </p>
            </motion.div>
          ) : (
            <motion.div key="btns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleTrade('call')}
                className="py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-transform active:scale-95"
                style={{ background: '#10B981', boxShadow: '0 4px 20px rgba(16,185,129,0.35)' }}
              >
                <span className="text-lg">⬆</span> Call
              </button>
              <button
                onClick={() => handleTrade('put')}
                className="py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-transform active:scale-95"
                style={{ background: '#EF4444', boxShadow: '0 4px 20px rgba(239,68,68,0.35)' }}
              >
                <span className="text-lg">⬇</span> Put
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── TRADING HISTORY (inline) ── */}
      <div className="px-4 pb-6">
        <div className="mb-3">
          <h3 className="font-bold text-base" style={{ color: textPri }}>Trading History</h3>
          <p className="text-xs mt-0.5" style={{ color: textSec }}>
            View all records and details of your past trading activities, records cannot be deleted.
          </p>
        </div>

        <div className="space-y-0">
          {(transactions || []).map((tx: any) => {
            const isCall = tx.type === 'buy';
            const pnlColor = isCall ? '#10B981' : '#EF4444';
            const profit = isCall ? tx.amount * PROFIT_RATE : -tx.amount;
            return (
              <div
                key={tx.id}
                className="py-3 border-b"
                style={{ borderColor: border }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: pnlColor }}>
                      {isCall ? 'Call' : 'Put'}
                    </span>
                    <span className="text-xs" style={{ color: textSec }}>
                      ${tx.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) ?? '0.00'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: pnlColor }}>
                      {profit >= 0 ? '+' : ''}${Math.abs(profit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold" style={{ color: textSec }}>{tx.asset_symbol || '—'}</span>
                    <span className="text-[11px]" style={{ color: textSec }}>
                      {tx.created_at ? format(new Date(tx.created_at), 'h:mmaaa') : '—'}
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-semibold capitalize"
                    style={{ color: tx.status === 'completed' ? '#10B981' : tx.status === 'failed' ? '#EF4444' : '#F59E0B' }}
                  >
                    {tx.status === 'completed' ? 'Success' : tx.status === 'failed' ? 'Failed' : 'Pending'}
                  </span>
                </div>
              </div>
            );
          })}

          {(!transactions || transactions.length === 0) && (
            <p className="text-center py-8 text-sm" style={{ color: textSec }}>No history yet</p>
          )}
        </div>
      </div>
    </div>
  );
}