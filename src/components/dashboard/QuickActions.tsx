import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownToLine, ArrowUpFromLine, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const actions = [
  { label: 'Deposit', icon: ArrowDownToLine },
  { label: 'Trade', icon: Zap },
  { label: 'Withdraw', icon: ArrowUpFromLine },
];

interface QuickActionsProps {
  onDeposit: () => void;
  onTrade: () => void;
  onWithdraw: () => void;
}

export default function QuickActions({ onDeposit, onTrade, onWithdraw }: QuickActionsProps) {
  const handlers = [onDeposit, onTrade, onWithdraw];

  return (
    <div className="flex items-center justify-center gap-8">
      {actions.map(({ label, icon: Icon }, i) => (
        <motion.button
          key={label}
          onClick={handlers[i]}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          whileTap={{ scale: 0.93 }}
          whileHover={{ y: -2 }}
          className="flex flex-col items-center gap-2 group"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 border bg-card border-border shadow-sm group-hover:shadow-md"
          >
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xs font-medium transition-colors text-muted-foreground group-hover:text-foreground">{label}</span>
        </motion.button>
      ))}
    </div>
  );
}