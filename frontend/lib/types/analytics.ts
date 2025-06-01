export interface AnalyticsOverview {
  total_views: number;
  total_unique_visitors: number;
  total_posts: number;
  total_published_posts: number;
  views_today: number;
  visitors_today: number;
  most_popular_post: string | null;
  recent_activity_count: number;
}

export interface TrafficData {
  date: string;
  views: number;
  unique_visitors: number;
}

export interface PostPerformance {
  post_id: number;
  title: string;
  slug: string;
  total_views: number;
  unique_views: number;
  published_at: string | null;
}

export interface DeviceStats {
  device_type: string;
  count: number;
  percentage: number;
}

export interface ReferrerStats {
  referrer: string;
  count: number;
  percentage: number;
}

export interface AnalyticsDashboardData {
  overview: AnalyticsOverview;
  traffic_data: TrafficData[];
  popular_posts: PostPerformance[];
  device_stats: DeviceStats[];
  referrer_stats: ReferrerStats[];
}

export interface PageViewData {
  url_path: string;
  post_id?: number;
  referrer?: string;
  session_id?: string;
}