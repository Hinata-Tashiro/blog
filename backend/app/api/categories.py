from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.category import Category
from app.models import category as category_model

router = APIRouter()


@router.get("/", response_model=List[Category])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(category_model.Category).order_by(
        category_model.Category.name
    ).all()
    return categories