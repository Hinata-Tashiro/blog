from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String(255), nullable=True)  # Optional session ID from frontend
    ip_address = Column(String(45), nullable=True)  # Optional IP tracking
    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationships
    post = relationship("Post", back_populates="likes")