from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from app.db.session import get_db
from app.schemas.post import Post, PostList
from app.models import post as post_model
from app.models.post import PostStatus

router = APIRouter()


@router.get("/", response_model=PostList)
def get_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Base query - only published posts
    query = db.query(post_model.Post).filter(
        post_model.Post.status == PostStatus.PUBLISHED,
        post_model.Post.published_at.isnot(None)
    )
    
    # Apply filters
    if category:
        query = query.join(post_model.Post.categories).filter(
            post_model.Category.slug == category
        )
    
    if tag:
        query = query.join(post_model.Post.tags).filter(
            post_model.Tag.slug == tag
        )
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            post_model.Post.title.ilike(search_term) |
            post_model.Post.content.ilike(search_term)
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * per_page
    posts = query.order_by(post_model.Post.published_at.desc()).offset(offset).limit(per_page).all()
    
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