from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class LikeBase(BaseModel):
    pass


class LikeCreate(LikeBase):
    session_id: Optional[str] = None


class Like(LikeBase):
    id: int
    post_id: int
    session_id: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LikeResponse(BaseModel):
    likes_count: int

    class Config:
        from_attributes = True