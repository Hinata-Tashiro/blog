from sqlalchemy import Column, Integer, String, Text, DateTime, func
from app.db.base import Base


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False, index=True)
    original_name = Column(String(255), nullable=False)
    alt_text = Column(String(500))
    caption = Column(Text)
    file_size = Column(Integer)  # in bytes
    width = Column(Integer)
    height = Column(Integer)
    mime_type = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())