from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, distinct
from app.models.analytics import PageView, SiteStatistic, PopularPost
from app.models.post import Post
from app.schemas.analytics import (
    PageViewCreate, 
    AnalyticsOverview, 
    TrafficData, 
    PostPerformance,
    DeviceStats,
    ReferrerStats
)
import re
import user_agents


class AnalyticsService:
    """アナリティクス関連のビジネスロジックを管理するサービスクラス"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_page_view(self, page_view_data: PageViewCreate, ip_address: str, user_agent_str: str) -> PageView:
        """ページビューを記録する"""
        # User Agentを解析してデバイスタイプを判定
        device_type = self._parse_device_type(user_agent_str)
        
        # 記事IDを取得（slugから）
        post_id = None
        if '/posts/' in page_view_data.url_path:
            slug_match = re.search(r'/posts/([^/]+)', page_view_data.url_path)
            if slug_match:
                slug = slug_match.group(1)
                post = self.db.query(Post).filter(Post.slug == slug).first()
                if post:
                    post_id = post.id
        
        page_view = PageView(
            post_id=post_id,
            url_path=page_view_data.url_path,
            ip_address=ip_address,
            user_agent=user_agent_str,
            referrer=page_view_data.referrer,
            session_id=page_view_data.session_id,
            device_type=device_type
        )
        
        self.db.add(page_view)
        self.db.commit()
        self.db.refresh(page_view)
        
        # 日別統計を更新
        self._update_daily_statistics()
        
        return page_view
    
    def get_analytics_overview(self) -> AnalyticsOverview:
        """アナリティクス概要データを取得する"""
        today = date.today()
        
        # 総ページビュー数
        total_views = self.db.query(PageView).count()
        
        # 総ユニークビジター数（IPアドレスベース）
        total_unique_visitors = self.db.query(distinct(PageView.ip_address)).count()
        
        # 総記事数と公開記事数
        total_posts = self.db.query(Post).count()
        total_published_posts = self.db.query(Post).filter(Post.status == 'published').count()
        
        # 今日のビュー数とビジター数
        views_today = self.db.query(PageView).filter(
            func.date(PageView.created_at) == today
        ).count()
        
        visitors_today = self.db.query(distinct(PageView.ip_address)).filter(
            func.date(PageView.created_at) == today
        ).count()
        
        # 最も人気の記事
        popular_post_query = (
            self.db.query(Post.title)
            .join(PageView, Post.id == PageView.post_id)
            .group_by(Post.id, Post.title)
            .order_by(desc(func.count(PageView.id)))
            .first()
        )
        most_popular_post = popular_post_query[0] if popular_post_query else None
        
        # 最近のアクティビティ数（過去7日間）
        seven_days_ago = datetime.now() - timedelta(days=7)
        recent_activity_count = self.db.query(PageView).filter(
            PageView.created_at >= seven_days_ago
        ).count()
        
        return AnalyticsOverview(
            total_views=total_views,
            total_unique_visitors=total_unique_visitors,
            total_posts=total_posts,
            total_published_posts=total_published_posts,
            views_today=views_today,
            visitors_today=visitors_today,
            most_popular_post=most_popular_post,
            recent_activity_count=recent_activity_count
        )
    
    def get_traffic_data(self, days: int = 30) -> List[TrafficData]:
        """指定期間のトラフィックデータを取得する"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days-1)
        
        traffic_data = []
        current_date = start_date
        
        while current_date <= end_date:
            # その日のページビュー数
            views = self.db.query(PageView).filter(
                func.date(PageView.created_at) == current_date
            ).count()
            
            # その日のユニークビジター数
            unique_visitors = self.db.query(distinct(PageView.ip_address)).filter(
                func.date(PageView.created_at) == current_date
            ).count()
            
            traffic_data.append(TrafficData(
                date=current_date,
                views=views,
                unique_visitors=unique_visitors
            ))
            
            current_date += timedelta(days=1)
        
        return traffic_data
    
    def get_popular_posts(self, limit: int = 10) -> List[PostPerformance]:
        """人気記事のランキングを取得する"""
        query = (
            self.db.query(
                Post.id,
                Post.title,
                Post.slug,
                Post.published_at,
                func.count(PageView.id).label('total_views'),
                func.count(distinct(PageView.ip_address)).label('unique_views')
            )
            .join(PageView, Post.id == PageView.post_id)
            .filter(Post.status == 'published')
            .group_by(Post.id, Post.title, Post.slug, Post.published_at)
            .order_by(desc('total_views'))
            .limit(limit)
        )
        
        results = query.all()
        
        return [
            PostPerformance(
                post_id=result.id,
                title=result.title,
                slug=result.slug,
                total_views=result.total_views,
                unique_views=result.unique_views,
                published_at=result.published_at
            )
            for result in results
        ]
    
    def get_device_stats(self) -> List[DeviceStats]:
        """デバイス別統計を取得する"""
        query = (
            self.db.query(
                PageView.device_type,
                func.count(PageView.id).label('count')
            )
            .filter(PageView.device_type.isnot(None))
            .group_by(PageView.device_type)
            .order_by(desc('count'))
        )
        
        results = query.all()
        total_count = sum(result.count for result in results)
        
        return [
            DeviceStats(
                device_type=result.device_type or 'Unknown',
                count=result.count,
                percentage=round((result.count / total_count) * 100, 2) if total_count > 0 else 0
            )
            for result in results
        ]
    
    def get_referrer_stats(self, limit: int = 10) -> List[ReferrerStats]:
        """参照元別統計を取得する"""
        query = (
            self.db.query(
                PageView.referrer,
                func.count(PageView.id).label('count')
            )
            .filter(PageView.referrer.isnot(None), PageView.referrer != '')
            .group_by(PageView.referrer)
            .order_by(desc('count'))
            .limit(limit)
        )
        
        results = query.all()
        total_count = self.db.query(PageView).filter(
            PageView.referrer.isnot(None), PageView.referrer != ''
        ).count()
        
        return [
            ReferrerStats(
                referrer=self._clean_referrer(result.referrer),
                count=result.count,
                percentage=round((result.count / total_count) * 100, 2) if total_count > 0 else 0
            )
            for result in results
        ]
    
    def _parse_device_type(self, user_agent_str: str) -> str:
        """User-Agentからデバイスタイプを判定する"""
        try:
            user_agent = user_agents.parse(user_agent_str)
            if user_agent.is_mobile:
                return 'mobile'
            elif user_agent.is_tablet:
                return 'tablet'
            elif user_agent.is_pc:
                return 'desktop'
            else:
                return 'other'
        except:
            return 'unknown'
    
    def _clean_referrer(self, referrer: str) -> str:
        """参照元URLをクリーンアップしてドメイン名を抽出する"""
        if not referrer:
            return 'Direct'
        
        try:
            # URLからドメイン名を抽出
            import urllib.parse
            parsed = urllib.parse.urlparse(referrer)
            domain = parsed.netloc
            
            # www.を削除
            if domain.startswith('www.'):
                domain = domain[4:]
            
            return domain or 'Unknown'
        except:
            return 'Unknown'
    
    def _update_daily_statistics(self):
        """日別統計を更新する"""
        today = date.today()
        
        # 今日の統計を取得または作成
        stat = self.db.query(SiteStatistic).filter(SiteStatistic.date == today).first()
        
        if not stat:
            stat = SiteStatistic(date=today)
            self.db.add(stat)
        
        # 統計データを計算
        stat.total_views = self.db.query(PageView).filter(
            func.date(PageView.created_at) == today
        ).count()
        
        stat.unique_visitors = self.db.query(distinct(PageView.ip_address)).filter(
            func.date(PageView.created_at) == today
        ).count()
        
        stat.posts_published = self.db.query(Post).filter(
            func.date(Post.published_at) == today,
            Post.status == 'published'
        ).count()
        
        stat.total_posts = self.db.query(Post).filter(Post.status == 'published').count()
        
        self.db.commit()