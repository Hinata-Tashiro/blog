from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime
from app.db.session import get_db
from app.schemas.post import Post, PostList
from app.schemas.like import LikeResponse, LikeCreate
from typing import Dict
from app.models import post as post_model
from app.models.post import PostStatus
from app.models.category import Category
from app.models.tag import Tag
from app.models.like import Like

router = APIRouter()


@router.get("/", response_model=PostList)
async def get_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    categories: Optional[List[str]] = Query(None),
    tags: Optional[List[str]] = Query(None),
    # 互換性のため単一選択も受け付け
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = Query(None, regex="^(latest|popular)$"),
    db: Session = Depends(get_db)
):
    # Base query - only published posts
    query = db.query(post_model.Post).filter(
        post_model.Post.status == PostStatus.PUBLISHED,
        post_model.Post.published_at.isnot(None)
    )
    
    # 互換性のため単一パラメータを複数パラメータに変換
    all_categories = list(categories) if categories else []
    if category:
        all_categories.append(category)
    
    all_tags = list(tags) if tags else []
    if tag:
        all_tags.append(tag)
    
    # Apply filters
    if all_categories:
        query = query.join(post_model.Post.categories).filter(
            Category.slug.in_(all_categories)
        )
    
    if all_tags:
        query = query.join(post_model.Post.tags).filter(
            Tag.slug.in_(all_tags)
        )
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            post_model.Post.title.ilike(search_term) |
            post_model.Post.content.ilike(search_term)
        )
    
    # Get total count
    total = query.count()
    
    # Apply sorting
    if sort == "popular":
        # 人気順（仮の実装：IDの降順）
        # TODO: 実際のPV数やいいね数でソート
        query = query.order_by(post_model.Post.id.desc())
    else:
        # デフォルト：最新順
        query = query.order_by(post_model.Post.published_at.desc())
    
    # Apply pagination
    offset = (page - 1) * per_page
    posts = query.offset(offset).limit(per_page).all()
    
    # Add likes count for each post
    for post in posts:
        post.likes_count = db.query(func.count(Like.id)).filter(Like.post_id == post.id).scalar()
        post.is_liked = False  # Frontend will handle this
    
    # Calculate total pages
    pages = (total + per_page - 1) // per_page
    
    return PostList(
        posts=posts,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/search", response_model=List[Post])
def search_posts(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    search_term = f"%{q}%"
    posts = db.query(post_model.Post).filter(
        and_(
            post_model.Post.status == PostStatus.PUBLISHED,
            post_model.Post.published_at.isnot(None),
            (post_model.Post.title.ilike(search_term) |
             post_model.Post.content.ilike(search_term))
        )
    ).order_by(post_model.Post.published_at.desc()).limit(limit).all()
    
    return posts


@router.get("/{slug}/related", response_model=Dict[str, List[Post]])
def get_related_posts(
    slug: str,
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    # まず対象の記事を取得
    post = db.query(post_model.Post).filter(
        post_model.Post.slug == slug,
        post_model.Post.status == PostStatus.PUBLISHED
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # カテゴリが同じ記事を取得
    related_by_category = []
    if post.categories:
        category_ids = [cat.id for cat in post.categories]
        related_by_category = db.query(post_model.Post).join(
            post_model.Post.categories
        ).filter(
            and_(
                Category.id.in_(category_ids),
                post_model.Post.id != post.id,
                post_model.Post.status == PostStatus.PUBLISHED,
                post_model.Post.published_at.isnot(None)
            )
        ).order_by(post_model.Post.published_at.desc()).limit(limit).all()
    
    # タグが同じ記事を取得
    related_by_tags = []
    if post.tags:
        tag_ids = [tag.id for tag in post.tags]
        related_by_tags = db.query(post_model.Post).join(
            post_model.Post.tags
        ).filter(
            and_(
                Tag.id.in_(tag_ids),
                post_model.Post.id != post.id,
                post_model.Post.status == PostStatus.PUBLISHED,
                post_model.Post.published_at.isnot(None)
            )
        ).order_by(post_model.Post.published_at.desc()).limit(limit).all()
    
    # 人気記事を取得（仮実装：最新記事）
    popular_posts = db.query(post_model.Post).filter(
        and_(
            post_model.Post.id != post.id,
            post_model.Post.status == PostStatus.PUBLISHED,
            post_model.Post.published_at.isnot(None)
        )
    ).order_by(post_model.Post.published_at.desc()).limit(limit).all()
    
    # Pydanticスキーマに変換
    return {
        "related_by_category": [Post.from_orm(post) for post in related_by_category[:limit]],
        "related_by_tags": [Post.from_orm(post) for post in related_by_tags[:limit]],
        "popular": [Post.from_orm(post) for post in popular_posts[:limit]]
    }


@router.get("/{slug}", response_model=Post)
async def get_post(
    slug: str,
    db: Session = Depends(get_db)
):
    post = db.query(post_model.Post).filter(
        post_model.Post.slug == slug,
        post_model.Post.status == PostStatus.PUBLISHED,
        post_model.Post.published_at.isnot(None)
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Add likes count
    post.likes_count = db.query(func.count(Like.id)).filter(Like.post_id == post.id).scalar()
    post.is_liked = False  # Frontend will handle this
    
    return post


@router.post("/{slug}/like", response_model=LikeResponse)
async def add_like(
    slug: str,
    like_data: LikeCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    # Get the post
    post = db.query(post_model.Post).filter(
        post_model.Post.slug == slug,
        post_model.Post.status == PostStatus.PUBLISHED
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Get client IP address
    client_ip = request.client.host if request.client else None
    
    # Always create a new like (no duplicate checking)
    new_like = Like(
        post_id=post.id,
        session_id=like_data.session_id,
        ip_address=client_ip
    )
    db.add(new_like)
    db.commit()
    
    # Get updated likes count
    likes_count = db.query(func.count(Like.id)).filter(Like.post_id == post.id).scalar()
    
    return LikeResponse(likes_count=likes_count)


@router.get("/{slug}/likes", response_model=LikeResponse)
async def get_post_likes(
    slug: str,
    db: Session = Depends(get_db)
):
    # Get the post
    post = db.query(post_model.Post).filter(
        post_model.Post.slug == slug,
        post_model.Post.status == PostStatus.PUBLISHED
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Get likes count
    likes_count = db.query(func.count(Like.id)).filter(Like.post_id == post.id).scalar()
    
    return LikeResponse(likes_count=likes_count)