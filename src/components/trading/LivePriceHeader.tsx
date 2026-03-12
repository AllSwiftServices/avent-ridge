import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function LivePriceHeader({ price, prevPrice, change, changePercent, high24h, low24h, volume }) {
  const isPositive = changePercent >= 0;
  const direction = price > prevPrice ? 'up' : price < prevPrice ? 'down' : 'same';

  const fmt = (n, d = 2) =>
    n?.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) ?? '—';

  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={Math.round(price * 100)}
          initial={{ opacity: 0.5, y: direction === 'up' ? 6 : -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            color: direction === 'up' ? '#FFC107' : direction === 'down' ? '#E53935' : 'white',
          }}
          className="text-3xl md:text-4xl font-bold tabular-nums tracking-tight"
        >
          ${fmt(price)}
        </motion.span>
      </AnimatePresence>

      <span className="text-base font-semibold px-2 py-0.5 rounded-lg"
        style={{ color: isPositive ? '#FFC107' : '#E53935', background: isPositive ? 'rgba(255,193,7,0.1)' : 'rgba(229,57,53,0.1)' }}>
        {isPositive ? '+' : ''}{fmt(changePercent)}%
      </span>

      <div className="flex gap-4 text-xs text-muted-foreground ml-auto">
        <span>H: <span className="text-foreground font-medium">${fmt(high24h)}</span></span>
        <span>L: <span className="text-foreground font-medium">${fmt(low24h)}</span></span>
        <span>Vol: <span className="text-foreground font-medium">{volume}</span></span>
      </div>
    </div>
  );
}