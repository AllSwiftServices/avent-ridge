import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WalletBreakdownCardProps {
  title: string;
  balance: number;
  change: number;
  hideBalance: boolean;
  index: number;
}

function WalletBreakdownCard({ title, balance, change, hideBalance, index }: WalletBreakdownCardProps) {
  const isPositive = change >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="shrink-0 w-48 rounded-2xl p-4 border transition-all bg-card border-border shadow-sm"
    >
      <p className="text-xs font-medium mb-3 text-muted-foreground">{title}</p>
      <p className="font-bold text-lg tracking-tight mb-1 text-foreground">
        {hideBalance ? '••••••' : `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      </p>
      <span className={cn('text-xs font-semibold', isPositive ? 'text-primary' : 'text-destructive')}>
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    </motion.div>
  );
}

interface WalletBreakdownProps {
  tradingBalance: number;
  holdingBalance: number;
  hideBalance: boolean;
}

export default function WalletBreakdown({ tradingBalance, holdingBalance, hideBalance }: WalletBreakdownProps) {
  const cards = [
    { title: 'Trading Wallet', balance: tradingBalance, change: 3.45 },
    { title: 'Holding Wallet', balance: holdingBalance, change: -0.82 },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide no-scrollbar">
      {cards.map((c, i) => (
        <WalletBreakdownCard key={c.title} {...c} hideBalance={hideBalance} index={i} />
      ))}
    </div>
  );
}