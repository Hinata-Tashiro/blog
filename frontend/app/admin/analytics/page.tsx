'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from '@/components/analytics/stats-card';
import { TrafficChart } from '@/components/analytics/traffic-chart';
import { DeviceStatsChart } from '@/components/analytics/device-stats-chart';
import { PopularPostsChart } from '@/components/analytics/popular-posts-chart';
import { analytics } from '@/lib/api';
import { AnalyticsDashboardData } from '@/lib/types/analytics';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Eye, 
  TrendingUp,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);

  useEffect(() => {
    loadDashboardData();
  }, [selectedDays]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await analytics.admin.dashboard(selectedDays);
      setDashboardData(data);
    } catch (err) {
      setError('アナリティクスデータの読み込みに失敗しました');
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">データを読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive">{error}</p>
              <button 
                onClick={loadDashboardData}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                再試行
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">アナリティクス</h1>
          <p className="text-muted-foreground">ブログのパフォーマンスと統計を確認</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
            className="px-3 py-2 border border-input bg-background rounded-md"
          >
            <option value={7}>過去7日</option>
            <option value={30}>過去30日</option>
            <option value={90}>過去90日</option>
          </select>
        </div>
      </div>

      {/* 概要統計カード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="総ページビュー"
          value={dashboardData.overview.total_views}
          description="全期間の総アクセス数"
          icon={Eye}
        />
        <StatsCard
          title="ユニークビジター"
          value={dashboardData.overview.total_unique_visitors}
          description="異なるIPアドレスからのアクセス"
          icon={Users}
        />
        <StatsCard
          title="公開記事数"
          value={dashboardData.overview.total_published_posts}
          description={`総記事数: ${dashboardData.overview.total_posts}件`}
          icon={FileText}
        />
        <StatsCard
          title="今日のアクセス"
          value={dashboardData.overview.views_today}
          description={`今日の訪問者: ${dashboardData.overview.visitors_today}人`}
          icon={TrendingUp}
        />
      </div>

      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="traffic">トラフィック推移</TabsTrigger>
          <TabsTrigger value="posts">人気記事</TabsTrigger>
          <TabsTrigger value="devices">デバイス統計</TabsTrigger>
          <TabsTrigger value="referrers">参照元</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>トラフィック推移</CardTitle>
              <CardDescription>
                過去{selectedDays}日間のページビューとユニークビジター数の推移
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrafficChart data={dashboardData.traffic_data} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>人気記事ランキング</CardTitle>
                <CardDescription>アクセス数上位の記事</CardDescription>
              </CardHeader>
              <CardContent>
                <PopularPostsChart data={dashboardData.popular_posts.slice(0, 10)} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>人気記事詳細</CardTitle>
                <CardDescription>詳細な統計情報</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.popular_posts.slice(0, 5).map((post, index) => (
                    <div key={post.post_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            #{index + 1}
                          </span>
                          <h4 className="font-medium text-sm leading-tight">
                            {post.title}
                          </h4>
                        </div>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{post.total_views} ビュー</span>
                          <span>{post.unique_views} ユニーク</span>
                        </div>
                      </div>
                      <Link 
                        href={`/posts/${post.slug}`}
                        className="p-1 hover:bg-muted rounded"
                        target="_blank"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>デバイス別統計</CardTitle>
              <CardDescription>
                アクセスに使用されたデバイスの分布
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceStatsChart data={dashboardData.device_stats} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>参照元統計</CardTitle>
              <CardDescription>
                どこからアクセスされているかの統計
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.referrer_stats.map((referrer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        {referrer.referrer === 'Direct' ? 'ダイレクトアクセス' : referrer.referrer}
                      </h4>
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{referrer.count} アクセス</span>
                        <span>{referrer.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${referrer.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 最も人気の記事情報 */}
      {dashboardData.overview.most_popular_post && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              注目の記事
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{dashboardData.overview.most_popular_post}</p>
            <p className="text-sm text-muted-foreground mt-1">
              最もアクセス数の多い記事です
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}