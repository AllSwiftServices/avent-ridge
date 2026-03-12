import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: any[];
  isPositive: boolean;
}

function Sparkline({ data, isPositive }: SparklineProps) {
  const color = isPositive ? '#FFC107' : '#E53935';
  return (
    <div className="w-16 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function makeSparkData(isPositive: boolean) {
  let v = 100;
  return Array.from({ length: 12 }, () => {
    v += (Math.random() - (isPositive ? 0.42 : 0.58)) * 4;
    return { v: parseFloat(v.toFixed(2)) };
  });
}

interface TopMoversProps {
  assets?: any[];
  onAssetClick?: (asset: any) => void;
}

export default function TopMovers({ assets, onAssetClick }: TopMoversProps) {
  const movers = (assets || []).slice(0, 6).map(a => ({
    ...a,
    sparkData: makeSparkData(a.change_percent >= 0),
  }));

  return (
    <div>
      <p className="font-bold text-base mb-3" style={{ color: '#1A1A2E' }}>Top Movers</p>
      <div className="rounded-2xl overflow-hidden border" style={{ background: '#FFFFFF', borderColor: '#E0E0E8', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
        {movers.map((asset, i) => {
          const isPositive = asset.change_percent >= 0;
          return (
            <motion.button
              key={asset.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onAssetClick?.(asset)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left',
                i < movers.length - 1 && 'border-b border-gray-100'
              )}
            >
              {/* Icon */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                style={{ background: '#FFC107' }}>
                {asset.symbol.slice(0, 2)}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: '#1A1A2E' }}>{asset.symbol}</p>
                <p className="text-xs truncate" style={{ color: '#6B7280' }}>{asset.name}</p>
              </div>

              {/* Sparkline */}
              <Sparkline data={asset.sparkData} isPositive={isPositive} />

              {/* Change */}
              <div className="text-right w-16 flex-shrink-0">
                <p className="text-sm font-semibold" style={{ color: '#1A1A2E' }}>
                  ${asset.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className={cn('text-xs font-bold', isPositive ? 'text-[#FFC107]' : 'text-[#E53935]')}>
                  {isPositive ? '+' : ''}{asset.change_percent?.toFixed(2)}%
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}