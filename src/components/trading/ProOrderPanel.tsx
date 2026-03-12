import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useAuth } from '@/lib/AuthContext';

export default function ProOrderPanel({ asset, price, balance: balanceProp = 12500, onOrderPlaced }: any) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dark = theme === 'dark';
  const surface = dark ? 'hsl(240 5% 8%)' : '#FFFFFF';
  const border = dark ? 'hsl(240 5% 14%)' : '#E0E0E8';
  const textPri = dark ? '#F9FAFB' : '#1A1A2E';
  const textSec = dark ? '#9CA3AF' : '#6B7280';
  const inputBg = dark ? 'hsl(240 5% 12%)' : '#EAECF0';

  const [tab, setTab] = useState('buy');
  const [orderType, setOrderType] = useState('market');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [step, setStep] = useState('input');

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

  const execPrice = orderType === 'market' ? price : (parseFloat(limitPrice) || price);
  const total = (parseFloat(quantity) || 0) * execPrice;
  const isBuy = tab === 'buy';

  const handleSubmit = async () => {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0 || !user) return;
    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: isBuy ? 'buy' : 'sell',
        asset_symbol: asset?.symbol,
        amount: total,
        price_at_transaction: execPrice,
        quantity: qty,
        status: 'completed',
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['transactions-all'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });

      setStep('success');
      onOrderPlaced?.({ side: tab, quantity: qty, entryPrice: execPrice, leverage });
      setTimeout(() => { setStep('input'); setQuantity(''); }, 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const pcts = [25, 50, 75, 100];

  return (
    <div className="rounded-3xl border p-4 space-y-4" style={{ background: surface, borderColor: border }}>
      {/* Buy / Sell tabs */}
      <div className="grid grid-cols-2 rounded-2xl overflow-hidden" style={{ background: inputBg }}>
        {['buy', 'sell'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="py-2.5 text-sm font-bold capitalize transition-all"
            style={tab === t
              ? { background: t === 'buy' ? '#10B981' : '#EF4444', color: '#fff', borderRadius: '1rem' }
              : { color: textSec }}
          >
            {t === 'buy' ? '▲ Buy / Long' : '▼ Sell / Short'}
          </button>
        ))}
      </div>

      {/* Order type */}
      <div className="flex gap-2">
        {['market', 'limit', 'stop'].map(ot => (
          <button
            key={ot}
            onClick={() => setOrderType(ot)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
            style={orderType === ot
              ? { background: '#FFC107', color: '#000' }
              : { background: inputBg, color: textSec }}
          >
            {ot}
          </button>
        ))}
      </div>

      {/* Price display */}
      <div className="flex items-center justify-between text-sm" style={{ color: textSec }}>
        <span>Market Price</span>
        <span className="font-bold" style={{ color: isBuy ? '#10B981' : '#EF4444' }}>
          ${price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
        </span>
      </div>

      {/* Limit price input */}
      {orderType !== 'market' && (
        <div>
          <p className="text-xs mb-1.5" style={{ color: textSec }}>
            {orderType === 'limit' ? 'Limit Price' : 'Stop Price'}
          </p>
          <input
            type="number"
            placeholder="Enter price"
            value={limitPrice}
            onChange={e => setLimitPrice(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: inputBg, color: textPri }}
          />
        </div>
      )}

      {/* Quantity */}
      <div>
        <p className="text-xs mb-1.5" style={{ color: textSec }}>Quantity ({asset?.symbol})</p>
        <input
          type="number"
          placeholder="0.00"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{ background: inputBg, color: textPri }}
        />
        <div className="flex gap-2 mt-2">
          {pcts.map(pct => (
            <button
              key={pct}
              onClick={() => setQuantity(((balance * pct / 100) / price).toFixed(6))}
              className="flex-1 py-1 rounded-lg text-xs font-semibold"
              style={{ background: inputBg, color: textSec }}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {/* Leverage */}
      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: textSec }}>
          <span>Leverage</span>
          <span className="font-bold" style={{ color: '#FFC107' }}>{leverage}x</span>
        </div>
        <input
          type="range" min={1} max={100} value={leverage}
          onChange={e => setLeverage(Number(e.target.value))}
          className="w-full accent-yellow-400"
        />
        <div className="flex justify-between text-[10px] mt-0.5" style={{ color: textSec }}>
          <span>1x</span><span>25x</span><span>50x</span><span>100x</span>
        </div>
      </div>

      {/* Order total */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: inputBg }}>
        <span className="text-xs" style={{ color: textSec }}>Order Total</span>
        <span className="text-sm font-bold" style={{ color: textPri }}>
          ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Submit */}
      <AnimatePresence mode="wait">
        {step === 'success' ? (
          <motion.div
            key="success"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center py-3 gap-2"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: isBuy ? '#10B981' : '#EF4444' }}>
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-bold" style={{ color: textPri }}>Order placed!</p>
          </motion.div>
        ) : (
          <motion.button
            key="btn"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
            style={{ background: isBuy ? '#10B981' : '#EF4444', boxShadow: `0 4px 20px ${isBuy ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}` }}
          >
            {isBuy ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {isBuy ? 'Buy / Long' : 'Sell / Short'} {asset?.symbol}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}