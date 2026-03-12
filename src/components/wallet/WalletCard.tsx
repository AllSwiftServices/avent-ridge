import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Bitcoin, TrendingUp, Eye, EyeOff, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AnimatedNumber from '../common/AnimatedNumber';
import { cn } from '@/lib/utils';

const iconMap = {
  main: Wallet,
  crypto: Bitcoin,
  stocks: TrendingUp,
};

export default function WalletCard({ 
  type = 'main', 
  title, 
  balance, 
  change, 
  hideBalance,
  onToggleHide,
  onDeposit,
  onWithdraw
}) {
  const Icon = iconMap[type] || Wallet;
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-3xl p-5 text-white"
      style={{
        background: '#141417',
        border: '1px solid rgba(255,193,7,0.2)',
        boxShadow: '0 0 24px rgba(255,193,7,0.05)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(255,193,7,0.12)' }}>
            <Icon className="h-5 w-5" style={{ color: '#FFC107' }} />
          </div>
          <span className="font-medium" style={{ color: '#B0B3B8' }}>{title}</span>
        </div>
        <button
          onClick={onToggleHide}
          className="p-2 rounded-lg transition-colors hover:bg-white/5"
        >
          {hideBalance ? <EyeOff className="h-4 w-4" style={{ color: '#B0B3B8' }} /> : <Eye className="h-4 w-4" style={{ color: '#B0B3B8' }} />}
        </button>
      </div>
      
      <div className="mb-4">
        {hideBalance ? (
          <span className="text-3xl font-bold tracking-tight text-white">••••••</span>
        ) : (
          <AnimatedNumber 
            value={balance} 
            prefix="$" 
            decimals={2}
            className="text-3xl font-bold tracking-tight text-white"
          />
        )}
        
        {!hideBalance && (
          <div className="flex items-center gap-1 mt-1 text-sm">
            <span style={{ color: isPositive ? '#FFC107' : '#E53935' }}>
              {isPositive ? '+' : ''}{change?.toFixed(2)}%
            </span>
            <span style={{ color: '#B0B3B8' }}>24h</span>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onDeposit}
          className="flex-1 border-0 btn-press text-white transition-all"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 12px rgba(255,193,7,0.3)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
          <ArrowDownLeft className="h-4 w-4 mr-1" style={{ color: '#FFC107' }} />
          Deposit
        </Button>
        <Button
          size="sm"
          onClick={onWithdraw}
          className="flex-1 border-0 btn-press text-white transition-all"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 12px rgba(255,193,7,0.3)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
          <ArrowUpRight className="h-4 w-4 mr-1" style={{ color: '#FFC107' }} />
          Withdraw
        </Button>
      </div>
    </motion.div>
  );
}