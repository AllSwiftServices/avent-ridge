import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import MiniChart from '../common/MiniChart';

export default function AssetCard({ asset, onClick, index = 0 }: { asset: any, onClick: () => void, index?: number }) {
  const isPositive = asset.change_percent >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        'flex items-center justify-between p-4 rounded-2xl cursor-pointer',
        'bg-card border border-border/50 hover:border-border',
        'transition-all duration-200 hover:shadow-lg',
        'dark:hover:shadow-primary/5'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          {asset.symbol?.slice(0, 2)}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{asset.symbol}</h3>
          <p className="text-sm text-muted-foreground truncate max-w-[120px]">
            {asset.name}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <MiniChart 
          data={asset.price_history} 
          isPositive={isPositive}
        />
        <div className="text-right min-w-[80px]">
          <p className="font-semibold text-foreground">
            ${asset.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={cn(
            'text-sm font-semibold',
            isPositive ? 'text-success' : 'text-destructive'
          )}>
            {isPositive ? '+' : ''}{asset.change_percent?.toFixed(2)}%
          </p>
        </div>
      </div>
    </motion.div>
  );
}