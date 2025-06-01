from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class PageView(Base):
    """ページビューを記録するテーブル"""
    __tablename__ = "page_views"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey('posts.id'), nullable=True, index=True)  # 記事ページの場合
    url_path = Column(String(500), nullable=False, index=True)  # アクセスされたURLパス
    ip_address = Column(String(45), nullable=True)  # IPv6対応
    user_agent = Column(Text, nullable=True)  # ブラウザ情報
    referrer = Column(String(1000), nullable=True)  # 参照元URL
    session_id = Column(String(255), nullable=True, index=True)  # セッションID
    country = Column(String(100), nullable=True)  # 国
    city = Column(String(100), nullable=True)  # 都市
    device_type = Column(String(50), nullable=True)  # デバイスタイプ（desktop, mobile, tablet）
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    post = relationship("Post", backref="page_views")


class SiteStatistic(Base):
    """日別の集計統計を保存するテーブル"""
    __tablename__ = "site_statistics"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, unique=True, index=True)
    total_views = Column(Integer, default=0)  # 総ページビュー数
    unique_visitors = Column(Integer, default=0)  # ユニークビジター数
    posts_published = Column(Integer, default=0)  # 公開された記事数
    total_posts = Column(Integer, default=0)  # 総記事数
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class PopularPost(Base):
    """人気記事の統計を保存するテーブル"""
    __tablename__ = "popular_posts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey('posts.id'), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    views_count = Column(Integer, default=0)
    unique_views = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    post = relationship("Post", backref="popularity_stats")
    
    # 一意制約：1日1記事につき1レコード
    __table_args__ = (
        {'extend_existing': True}
    )