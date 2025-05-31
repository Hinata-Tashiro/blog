from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.tag import Tag
from app.models import tag as tag_model

router = APIRouter()


@router.get("/", response_model=List[Tag])
def get_tags(db: Session = Depends(get_db)):
    tags = db.query(tag_model.Tag).order_by(
        tag_model.Tag.name
    ).all()
    return tags