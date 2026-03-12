import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = [
  'var(--color-primary)',
  'hsl(var(--success))',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  'hsl(var(--destructive))',
  '#06B6D4',
  '#84CC16'
];

export default function AllocationChart({ data }: { data: { name: string, value: number, color?: string }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        No holdings yet
      </div>
    );
  }

  const total = data.reduce((sum: number, item: any) => sum + item.value, 0);
  const chartData = data.map((item: any, index: number) => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1)
  }));

  return (
    <div className="flex items-center gap-4">
      <div className="w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry: any, index: number) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
              }}
              formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, 'Value']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex-1 space-y-2">
        {chartData.slice(0, 5).map((item, index) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="font-medium">{item.name}</span>
            </div>
            <span className="text-muted-foreground">{item.percentage}%</span>
          </div>
        ))}
        {chartData.length > 5 && (
          <p className="text-xs text-muted-foreground">+{chartData.length - 5} more</p>
        )}
      </div>
    </div>
  );
}