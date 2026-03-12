import React from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function PositionPanel({ position, currentPrice, onClose }) {
  if (!position) return null;

  const pnl = (currentPrice - position.entryPrice) * position.quantity * (position.side === 'buy' ? 1 : -1);
  const pnlPct = (pnl / (position.entryPrice * position.quantity)) * 100;
  const isProfit = pnl >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border overflow-hidden"
      style={{ borderColor: isProfit ? 'rgba(255,193,7,0.3)' : 'rgba(229,57,53,0.3)', background: isProfit ? 'rgba(255,193,7,0.04)' : 'rgba(229,57,53,0.04)' }}
    >
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: isProfit ? '#FFC107' : '#E53935' }} />
          <h3 className="font-bold text-sm">Open Position · {position.symbol}</h3>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: position.side === 'buy' ? 'rgba(255,193,7,0.2)' : 'rgba(229,57,53,0.2)', color: position.side === 'buy' ? '#FFC107' : '#E53935' }}>
          {position.side.toUpperCase()} {position.leverage}x
        </span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            ['Entry Price', `$${position.entryPrice.toFixed(2)}`],
            ['Current Price', `$${currentPrice.toFixed(2)}`],
            ['Quantity', position.quantity.toFixed(4)],
            ['Margin', `$${(position.entryPrice * position.quantity / position.leverage).toFixed(2)}`],
          ].map(([label, val]) => (
            <div key={label} className="p-3 rounded-xl bg-background/60">
              <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
              <p className="font-semibold text-sm">{val}</p>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl text-center mb-4"
          style={{ background: isProfit ? 'rgba(255,193,7,0.08)' : 'rgba(229,57,53,0.08)' }}>
          <p className="text-xs text-muted-foreground mb-1">Unrealized P&L</p>
          <div className="flex items-center justify-center gap-2">
            {isProfit ? <TrendingUp className="h-5 w-5" style={{ color: '#FFC107' }} /> : <TrendingDown className="h-5 w-5" style={{ color: '#E53935' }} />}
            <p className="text-2xl font-bold" style={{ color: isProfit ? '#FFC107' : '#E53935' }}>
              {isProfit ? '+' : ''}${pnl.toFixed(2)}
            </p>
            <span className="text-sm font-medium" style={{ color: isProfit ? '#FFC107' : '#E53935' }}>
              ({isProfit ? '+' : ''}{pnlPct.toFixed(2)}%)
            </span>
          </div>
        </div>

        <Button
          onClick={onClose}
          className="w-full h-11 rounded-2xl font-bold btn-press"
          style={{ background: isProfit ? '#FFC107' : '#E53935', color: isProfit ? '#000' : '#fff' }}
        >
          Close Position
        </Button>
      </div>
    </motion.div>
  );
}