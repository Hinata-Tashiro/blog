from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class CategoryBase(BaseModel):
    name: str = Field(..., max_length=50)
    slug: str = Field(..., max_length=50)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=50)
    slug: Optional[str] = Field(None, max_length=50)


class CategoryInDB(CategoryBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class Category(CategoryInDB):
    pass


class CategoryResponse(CategoryInDB):
    pass