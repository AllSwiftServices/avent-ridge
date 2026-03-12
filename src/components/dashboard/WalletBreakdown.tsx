import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

function WalletBreakdownCard({ title, balance, change, hideBalance, index }) {
  const isPositive = change >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex-shrink-0 w-48 rounded-2xl p-4 border transition-all"
      style={{ background: '#FFFFFF', borderColor: '#E0E0E8', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      <p className="text-xs font-medium mb-3" style={{ color: '#6B7280' }}>{title}</p>
      <p className="font-bold text-lg tracking-tight mb-1" style={{ color: '#1A1A2E' }}>
        {hideBalance ? '••••••' : `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      </p>
      <span className={cn('text-xs font-semibold', isPositive ? 'text-[#FFC107]' : 'text-[#E53935]')}>
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    </motion.div>
  );
}

export default function WalletBreakdown({ mainBalance, cryptoValue, stockValue, hideBalance }) {
  const cards = [
    { title: 'Main Wallet', balance: mainBalance, change: 1.23 },
    { title: 'Crypto Wallet', balance: cryptoValue, change: 3.45 },
    { title: 'Stock Wallet', balance: stockValue, change: -0.82 },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
      {cards.map((c, i) => (
        <WalletBreakdownCard key={c.title} {...c} hideBalance={hideBalance} index={i} />
      ))}
    </div>
  );
}