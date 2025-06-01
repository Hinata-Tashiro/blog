'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrafficData } from '@/lib/types/analytics';
import { format, parseISO } from 'date-fns';

interface TrafficChartProps {
  data: TrafficData[];
}

export function TrafficChart({ data }: TrafficChartProps) {
  // データを日付でソートし、フォーマット
  const formattedData = data
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(item => ({
      ...item,
      formattedDate: format(parseISO(item.date), 'MM/dd'),
    }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="formattedDate" 
            className="text-muted-foreground"
            fontSize={12}
          />
          <YAxis className="text-muted-foreground" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            labelFormatter={(label) => `日付: ${label}`}
            formatter={(value, name) => [
              value,
              name === 'views' ? 'ページビュー' : 'ユニークビジター'
            ]}
          />
          <Legend
            formatter={(value) => 
              value === 'views' ? 'ページビュー' : 'ユニークビジター'
            }
          />
          <Line
            type="monotone"
            dataKey="views"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="unique_visitors"
            stroke="hsl(var(--secondary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: 'hsl(var(--secondary))', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}