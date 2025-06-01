from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ImageBase(BaseModel):
    filename: str
    original_name: str
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    mime_type: Optional[str] = None


class ImageCreate(ImageBase):
    pass


class ImageUpdate(BaseModel):
    alt_text: Optional[str] = None
    caption: Optional[str] = None


class ImageInDB(ImageBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class Image(ImageInDB):
    pass


class ImageResponse(ImageInDB):
    pass


class ImageUploadResponse(BaseModel):
    id: int
    filename: str
    url: str
    message: str