from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
from app.db.session import get_db
from app.schemas.post import Post, PostList
from app.models import post as post_model
from app.models.post import PostStatus
from app.models.category import Category
from app.models.tag import Tag

router = APIRouter()


@router.get("/", response_model=PostList)
def get_posts(
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
    
    # Calculate total pages
    pages = (total + per_page - 1) // per_page
    
    return PostList(
        posts=posts,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/{slug}", response_model=Post)
def get_post(slug: str, db: Session = Depends(get_db)):
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
    
    return post


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