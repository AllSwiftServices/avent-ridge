import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const FILTERS = ['1D', '7D', '1M', '3M', '1Y', 'ALL'];

function generateData(days: number, baseValue: number, isPositive: boolean) {
  const points = [];
  let val = baseValue * (isPositive ? 0.94 : 1.06);
  for (let i = 0; i < days; i++) {
    const drift = isPositive ? 0.52 : 0.48;
    val = Math.max(val * 0.9, val + (Math.random() - drift) * val * 0.02);
    points.push({ label: i, value: parseFloat(val.toFixed(2)) });
  }
  if (points.length > 0) {
    points[points.length - 1].value = baseValue;
  }
  return points;
}

const PERIOD_POINTS: Record<string, number> = { '1D': 24, '7D': 7, '1M': 30, '3M': 90, '1Y': 52, 'ALL': 60 };

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  isPositive: boolean;
}

const CustomTooltip = ({ active, payload, isPositive }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className={cn('font-bold', isPositive ? 'text-[#FFC107]' : 'text-[#E53935]')}>
        ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
};

interface BalanceChartProps {
  totalBalance: number;
  isPositive: boolean;
}

export default function BalanceChart({ totalBalance, isPositive }: BalanceChartProps) {
  const [active, setActive] = useState('7D');
  const data = useMemo(() => generateData(PERIOD_POINTS[active], totalBalance, isPositive), [active, totalBalance]);
  const color = isPositive ? '#FFC107' : '#E53935';
  const gradientId = isPositive ? 'gainGrad' : 'lossGrad';

  return (
    <div>
      <motion.div
        key={active}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="h-44"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip isPositive={isPositive} />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
              dot={false}
              style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Time filters */}
      <div className="flex gap-1 mt-3 rounded-2xl p-1" style={{ background: '#F0F0F5' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={cn(
              'flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all',
              active === f
                ? 'bg-[#FFC107] text-black'
                : 'text-gray-500 hover:text-gray-800'
            )}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}