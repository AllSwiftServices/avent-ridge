import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const ASSETS = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
  { symbol: 'AMZN', name: 'Amazon.com', type: 'stock' },
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', pair: 'BTC/USDT' },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto', pair: 'ETH/USDT' },
  { symbol: 'SOL', name: 'Solana', type: 'crypto', pair: 'SOL/USDT' },
  { symbol: 'XRP', name: 'Ripple', type: 'crypto', pair: 'XRP/USDT' },
];

export default function AssetSelector({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = ASSETS.filter(a =>
    a.symbol.toLowerCase().includes(query.toLowerCase()) ||
    a.name.toLowerCase().includes(query.toLowerCase())
  );

  const displayName = selected?.type === 'crypto' ? (selected?.pair || `${selected?.symbol}/USDT`) : selected?.symbol;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all',
          'bg-muted/60 hover:bg-muted border border-border/50',
          'text-left font-semibold'
        )}
      >
        <div className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white',
          selected?.type === 'crypto' ? 'bg-gradient-to-br from-orange-400 to-amber-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
        )}>
          {selected?.symbol?.slice(0, 2)}
        </div>
        <span className="text-base">{displayName}</span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute top-full left-0 mt-2 w-64 z-50',
              'bg-card border border-border rounded-2xl shadow-2xl overflow-hidden'
            )}
          >
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-muted rounded-xl outline-none"
                />
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto p-2 space-y-0.5">
              {['stock', 'crypto'].map(type => {
                const group = filtered.filter(a => a.type === type);
                if (!group.length) return null;
                return (
                  <div key={type}>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1">
                      {type === 'stock' ? 'Stocks' : 'Crypto'}
                    </p>
                    {group.map(asset => (
                      <button
                        key={asset.symbol}
                        onClick={() => { onChange(asset); setOpen(false); setQuery(''); }}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                          'hover:bg-muted',
                          selected?.symbol === asset.symbol && 'bg-primary/10 text-primary'
                        )}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white',
                          type === 'crypto' ? 'bg-gradient-to-br from-orange-400 to-amber-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        )}>
                          {asset.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{asset.pair || asset.symbol}</p>
                          <p className="text-xs text-muted-foreground">{asset.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}