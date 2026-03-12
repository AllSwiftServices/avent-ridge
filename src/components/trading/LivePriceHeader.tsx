import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function LivePriceHeader({ price, prevPrice, change, changePercent, high24h, low24h, volume }: {
  price: number;
  prevPrice: number | null;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume: string;
}) {
  const isPositive = changePercent >= 0;
  const direction = !prevPrice || price === prevPrice ? 'same' : price > prevPrice ? 'up' : 'down';

  const fmt = (n: number, d = 2) =>
    n?.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) ?? '—';

  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={Math.round(price * 100)}
          className={cn(
            "text-3xl md:text-4xl font-bold tabular-nums tracking-tight",
            direction === 'up' ? 'text-success' : direction === 'down' ? 'text-destructive' : 'text-foreground'
          )}
        >
          ${fmt(price)}
        </motion.span>
      </AnimatePresence>

      <span className={cn(
        "text-base font-semibold px-2 py-0.5 rounded-lg",
        isPositive ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'
      )}>
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