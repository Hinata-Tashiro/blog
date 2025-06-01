from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.analytics import AnalyticsService
from app.schemas.analytics import (
    PageViewCreate,
    PageViewResponse,
    AnalyticsOverview,
    TrafficData,
    PostPerformance,
    DeviceStats,
    ReferrerStats,
    AnalyticsDashboardData
)

router = APIRouter()


@router.post("/track", response_model=dict)
async def track_page_view(
    page_view_data: PageViewCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """ページビューを記録する（認証不要）"""
    try:
        # クライアントのIPアドレスを取得
        client_ip = request.client.host if request.client else "unknown"
        
        # X-Forwarded-Forヘッダーから実際のIPを取得（プロキシ経由の場合）
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        # User-Agentヘッダーを取得
        user_agent = request.headers.get("User-Agent", "")
        
        # アナリティクスサービスを使用してページビューを記録
        analytics_service = AnalyticsService(db)
        page_view = analytics_service.create_page_view(
            page_view_data=page_view_data,
            ip_address=client_ip,
            user_agent_str=user_agent
        )
        
        return {"status": "success", "message": "Page view recorded"}
    
    except Exception as e:
        # エラーが発生してもフロントエンドに影響しないよう、ログだけ記録
        print(f"Analytics tracking error: {str(e)}")
        return {"status": "error", "message": "Failed to record page view"}


@router.get("/admin/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """アナリティクス概要データを取得する（管理者のみ）"""
    analytics_service = AnalyticsService(db)
    return analytics_service.get_analytics_overview()


@router.get("/admin/traffic", response_model=List[TrafficData])
async def get_traffic_data(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """トラフィックデータを取得する（管理者のみ）"""
    if days > 365:  # 最大1年間
        days = 365
    
    analytics_service = AnalyticsService(db)
    return analytics_service.get_traffic_data(days=days)


@router.get("/admin/popular-posts", response_model=List[PostPerformance])
async def get_popular_posts(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """人気記事ランキングを取得する（管理者のみ）"""
    if limit > 50:  # 最大50件
        limit = 50
    
    analytics_service = AnalyticsService(db)
    return analytics_service.get_popular_posts(limit=limit)


@router.get("/admin/device-stats", response_model=List[DeviceStats])
async def get_device_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """デバイス別統計を取得する（管理者のみ）"""
    analytics_service = AnalyticsService(db)
    return analytics_service.get_device_stats()


@router.get("/admin/referrer-stats", response_model=List[ReferrerStats])
async def get_referrer_stats(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """参照元別統計を取得する（管理者のみ）"""
    if limit > 20:  # 最大20件
        limit = 20
    
    analytics_service = AnalyticsService(db)
    return analytics_service.get_referrer_stats(limit=limit)


@router.get("/admin/dashboard", response_model=AnalyticsDashboardData)
async def get_dashboard_data(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ダッシュボード用の総合データを取得する（管理者のみ）"""
    analytics_service = AnalyticsService(db)
    
    # 各種データを並行して取得
    overview = analytics_service.get_analytics_overview()
    traffic_data = analytics_service.get_traffic_data(days=days)
    popular_posts = analytics_service.get_popular_posts(limit=10)
    device_stats = analytics_service.get_device_stats()
    referrer_stats = analytics_service.get_referrer_stats(limit=10)
    
    return AnalyticsDashboardData(
        overview=overview,
        traffic_data=traffic_data,
        popular_posts=popular_posts,
        device_stats=device_stats,
        referrer_stats=referrer_stats
    )