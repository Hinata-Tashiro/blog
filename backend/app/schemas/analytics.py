from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel


class PageViewCreate(BaseModel):
    """ページビュー記録用のスキーマ"""
    post_id: Optional[int] = None
    url_path: str
    referrer: Optional[str] = None
    user_agent: Optional[str] = None
    session_id: Optional[str] = None


class PageViewResponse(BaseModel):
    """ページビュー応答用のスキーマ"""
    id: int
    post_id: Optional[int]
    url_path: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    referrer: Optional[str]
    session_id: Optional[str]
    country: Optional[str]
    city: Optional[str]
    device_type: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SiteStatisticResponse(BaseModel):
    """サイト統計応答用のスキーマ"""
    id: int
    date: date
    total_views: int
    unique_visitors: int
    posts_published: int
    total_posts: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PopularPostResponse(BaseModel):
    """人気記事応答用のスキーマ"""
    id: int
    post_id: int
    date: date
    views_count: int
    unique_views: int
    post_title: Optional[str] = None
    post_slug: Optional[str] = None

    class Config:
        from_attributes = True


class AnalyticsOverview(BaseModel):
    """アナリティクス概要用のスキーマ"""
    total_views: int
    total_unique_visitors: int
    total_posts: int
    total_published_posts: int
    views_today: int
    visitors_today: int
    most_popular_post: Optional[str] = None
    recent_activity_count: int


class TrafficData(BaseModel):
    """トラフィックデータ用のスキーマ"""
    date: date
    views: int
    unique_visitors: int


class PostPerformance(BaseModel):
    """記事パフォーマンス用のスキーマ"""
    post_id: int
    title: str
    slug: str
    total_views: int
    unique_views: int
    published_at: Optional[datetime]


class DeviceStats(BaseModel):
    """デバイス統計用のスキーマ"""
    device_type: str
    count: int
    percentage: float


class ReferrerStats(BaseModel):
    """参照元統計用のスキーマ"""
    referrer: str
    count: int
    percentage: float


class AnalyticsDashboardData(BaseModel):
    """ダッシュボード用の総合データスキーマ"""
    overview: AnalyticsOverview
    traffic_data: List[TrafficData]
    popular_posts: List[PostPerformance]
    device_stats: List[DeviceStats]
    referrer_stats: List[ReferrerStats]