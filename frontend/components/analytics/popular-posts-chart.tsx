'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PostPerformance } from '@/lib/types/analytics';

interface PopularPostsChartProps {
  data: PostPerformance[];
}

export function PopularPostsChart({ data }: PopularPostsChartProps) {
  // データを短縮したタイトルに変換
  const formattedData = data.map(item => ({
    ...item,
    shortTitle: item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="shortTitle" 
            className="text-muted-foreground"
            fontSize={10}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis className="text-muted-foreground" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            labelFormatter={(label) => {
              const post = formattedData.find(p => p.shortTitle === label);
              return post ? post.title : label;
            }}
            formatter={(value, name) => [
              value,
              name === 'total_views' ? 'ページビュー' : 'ユニークビュー'
            ]}
          />
          <Bar 
            dataKey="total_views" 
            fill="hsl(var(--primary))" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}