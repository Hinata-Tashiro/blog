from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models.post import PostStatus
from app.schemas.category import Category
from app.schemas.tag import Tag
from app.schemas.user import User


class PostBase(BaseModel):
    title: str = Field(..., max_length=200)
    slug: str = Field(..., max_length=200)
    content: str
    excerpt: Optional[str] = None
    status: PostStatus = PostStatus.DRAFT
    featured_image_id: Optional[int] = None


class PostCreate(PostBase):
    category_ids: List[int] = []
    tag_ids: List[int] = []


class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    slug: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = None
    excerpt: Optional[str] = None
    status: Optional[PostStatus] = None
    featured_image_id: Optional[int] = None
    category_ids: Optional[List[int]] = None
    tag_ids: Optional[List[int]] = None


class PostInDB(PostBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class Post(PostInDB):
    user: User
    categories: List[Category] = []
    tags: List[Tag] = []
    featured_image: Optional["Image"] = None


class PostResponse(Post):
    pass

# Import here to avoid circular import
from app.schemas.image import Image
Post.model_rebuild()


class PostList(BaseModel):
    posts: List[Post]
    total: int
    page: int
    per_page: int
    pages: int