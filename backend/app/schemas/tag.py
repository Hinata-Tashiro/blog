from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class TagBase(BaseModel):
    name: str = Field(..., max_length=50)
    slug: str = Field(..., max_length=50)


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=50)
    slug: Optional[str] = Field(None, max_length=50)


class TagInDB(TagBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class Tag(TagInDB):
    pass


class TagResponse(TagInDB):
    pass