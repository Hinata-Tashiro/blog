'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DeviceStats } from '@/lib/types/analytics';

interface DeviceStatsChartProps {
  data: DeviceStats[];
}

const COLORS = {
  desktop: 'hsl(var(--primary))',
  mobile: 'hsl(var(--secondary))',
  tablet: 'hsl(var(--accent))',
  other: 'hsl(var(--muted))',
  unknown: 'hsl(var(--muted-foreground))',
};

const DEVICE_LABELS = {
  desktop: 'デスクトップ',
  mobile: 'モバイル',
  tablet: 'タブレット',
  other: 'その他',
  unknown: '不明',
};

export function DeviceStatsChart({ data }: DeviceStatsChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    label: DEVICE_LABELS[item.device_type as keyof typeof DEVICE_LABELS] || item.device_type,
    color: COLORS[item.device_type as keyof typeof COLORS] || COLORS.other,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={formattedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ label, percentage }) => `${label}: ${percentage.toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            formatter={(value, name) => [
              `${value} (${formattedData.find(d => d.count === value)?.percentage}%)`,
              'アクセス数'
            ]}
            labelFormatter={(label) => `${label}`}
          />
          <Legend
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>
                {DEVICE_LABELS[value as keyof typeof DEVICE_LABELS] || value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}