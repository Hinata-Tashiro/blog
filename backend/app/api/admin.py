from typing import List, Optional
from datetime import datetime
import io
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.api.deps import get_current_user
from app.schemas.post import Post, PostCreate, PostUpdate, PostList
from app.schemas.category import Category, CategoryCreate, CategoryUpdate
from app.schemas.tag import Tag, TagCreate, TagUpdate
from app.schemas.image import Image, ImageCreate, ImageUpdate, ImageUploadResponse
from app.models import post as post_model, category as category_model, tag as tag_model, user as user_model, image as image_model
from app.models.post import PostStatus
import os
import uuid
from PIL import Image as PILImage


class BulkPostOperation(BaseModel):
    post_ids: List[int]
    operation: str  # "delete", "publish", "unpublish"


class BulkOperationResponse(BaseModel):
    success_count: int
    error_count: int
    errors: List[str]

router = APIRouter()


# Posts
@router.get("/posts", response_model=PostList)
def get_all_posts(
    page: int = 1,
    per_page: int = 10,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(post_model.Post)
    total = query.count()
    
    offset = (page - 1) * per_page
    posts = query.order_by(post_model.Post.created_at.desc()).offset(offset).limit(per_page).all()
    
    pages = (total + per_page - 1) // per_page
    
    return PostList(
        posts=posts,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.post("/posts", response_model=Post)
def create_post(
    post_in: PostCreate,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if slug already exists
    existing_post = db.query(post_model.Post).filter(
        post_model.Post.slug == post_in.slug
    ).first()
    
    if existing_post:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post with this slug already exists"
        )
    
    # Create post
    post = post_model.Post(
        **post_in.model_dump(exclude={"category_ids", "tag_ids"}),
        user_id=current_user.id
    )
    
    # Add categories
    if post_in.category_ids:
        categories = db.query(category_model.Category).filter(
            category_model.Category.id.in_(post_in.category_ids)
        ).all()
        post.categories = categories
    
    # Add tags
    if post_in.tag_ids:
        tags = db.query(tag_model.Tag).filter(
            tag_model.Tag.id.in_(post_in.tag_ids)
        ).all()
        post.tags = tags
    
    # Set published_at if publishing
    if post_in.status == PostStatus.PUBLISHED:
        post.published_at = datetime.utcnow()
    
    db.add(post)
    db.commit()
    db.refresh(post)
    
    return post


@router.get("/posts/{post_id}", response_model=Post)
def get_post(
    post_id: int,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(post_model.Post).filter(
        post_model.Post.id == post_id
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    return post


@router.put("/posts/{post_id}", response_model=Post)
def update_post(
    post_id: int,
    post_in: PostUpdate,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(post_model.Post).filter(
        post_model.Post.id == post_id
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Update fields
    update_data = post_in.model_dump(exclude_unset=True, exclude={"category_ids", "tag_ids"})
    for field, value in update_data.items():
        setattr(post, field, value)
    
    # Update categories if provided
    if post_in.category_ids is not None:
        categories = db.query(category_model.Category).filter(
            category_model.Category.id.in_(post_in.category_ids)
        ).all()
        post.categories = categories
    
    # Update tags if provided
    if post_in.tag_ids is not None:
        tags = db.query(tag_model.Tag).filter(
            tag_model.Tag.id.in_(post_in.tag_ids)
        ).all()
        post.tags = tags
    
    # Update published_at
    if post_in.status == PostStatus.PUBLISHED and not post.published_at:
        post.published_at = datetime.utcnow()
    elif post_in.status == PostStatus.DRAFT:
        post.published_at = None
    
    db.commit()
    db.refresh(post)
    
    return post


@router.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(post_model.Post).filter(
        post_model.Post.id == post_id
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    db.delete(post)
    db.commit()
    
    return {"message": "Post deleted successfully"}


@router.post("/posts/bulk", response_model=BulkOperationResponse)
def bulk_post_operation(
    operation: BulkPostOperation,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success_count = 0
    error_count = 0
    errors = []
    
    for post_id in operation.post_ids:
        try:
            post = db.query(post_model.Post).filter(
                post_model.Post.id == post_id
            ).first()
            
            if not post:
                errors.append(f"Post {post_id} not found")
                error_count += 1
                continue
            
            if operation.operation == "delete":
                db.delete(post)
                success_count += 1
            elif operation.operation == "publish":
                post.status = PostStatus.PUBLISHED
                if not post.published_at:
                    post.published_at = datetime.utcnow()
                success_count += 1
            elif operation.operation == "unpublish":
                post.status = PostStatus.DRAFT
                post.published_at = None
                success_count += 1
            else:
                errors.append(f"Invalid operation: {operation.operation}")
                error_count += 1
                continue
                
        except Exception as e:
            errors.append(f"Error processing post {post_id}: {str(e)}")
            error_count += 1
    
    if success_count > 0:
        db.commit()
    
    return BulkOperationResponse(
        success_count=success_count,
        error_count=error_count,
        errors=errors
    )


# Categories
@router.post("/categories", response_model=Category)
def create_category(
    category_in: CategoryCreate,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if category exists
    existing = db.query(category_model.Category).filter(
        (category_model.Category.name == category_in.name) |
        (category_model.Category.slug == category_in.slug)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name or slug already exists"
        )
    
    category = category_model.Category(**category_in.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return category


@router.get("/categories", response_model=List[Category])
def get_all_categories(
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    categories = db.query(category_model.Category).order_by(
        category_model.Category.name
    ).all()
    return categories


@router.get("/categories/{category_id}", response_model=Category)
def get_category(
    category_id: int,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    category = db.query(category_model.Category).filter(
        category_model.Category.id == category_id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    return category


@router.put("/categories/{category_id}", response_model=Category)
def update_category(
    category_id: int,
    category_in: CategoryUpdate,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    category = db.query(category_model.Category).filter(
        category_model.Category.id == category_id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check for duplicate name/slug if they are being updated
    update_data = category_in.model_dump(exclude_unset=True)
    if update_data:
        existing = db.query(category_model.Category).filter(
            category_model.Category.id != category_id
        )
        
        if "name" in update_data:
            existing = existing.filter(category_model.Category.name == update_data["name"])
        elif "slug" in update_data:
            existing = existing.filter(category_model.Category.slug == update_data["slug"])
        
        if existing.first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name or slug already exists"
            )
    
    # Update fields
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    
    return category


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    category = db.query(category_model.Category).filter(
        category_model.Category.id == category_id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check if category is used in any posts
    posts_count = db.query(post_model.Post).filter(
        post_model.Post.categories.any(category_model.Category.id == category_id)
    ).count()
    
    if posts_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category. It is used in {posts_count} post(s)."
        )
    
    db.delete(category)
    db.commit()
    
    return {"message": "Category deleted successfully"}


# Tags
@router.post("/tags", response_model=Tag)
def create_tag(
    tag_in: TagCreate,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if tag exists
    existing = db.query(tag_model.Tag).filter(
        (tag_model.Tag.name == tag_in.name) |
        (tag_model.Tag.slug == tag_in.slug)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag with this name or slug already exists"
        )
    
    tag = tag_model.Tag(**tag_in.model_dump())
    db.add(tag)
    db.commit()
    db.refresh(tag)
    
    return tag


@router.get("/tags", response_model=List[Tag])
def get_all_tags(
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tags = db.query(tag_model.Tag).order_by(
        tag_model.Tag.name
    ).all()
    return tags


@router.get("/tags/{tag_id}", response_model=Tag)
def get_tag(
    tag_id: int,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tag = db.query(tag_model.Tag).filter(
        tag_model.Tag.id == tag_id
    ).first()
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    return tag


@router.put("/tags/{tag_id}", response_model=Tag)
def update_tag(
    tag_id: int,
    tag_in: TagUpdate,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tag = db.query(tag_model.Tag).filter(
        tag_model.Tag.id == tag_id
    ).first()
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    # Check for duplicate name/slug if they are being updated
    update_data = tag_in.model_dump(exclude_unset=True)
    if update_data:
        existing = db.query(tag_model.Tag).filter(
            tag_model.Tag.id != tag_id
        )
        
        if "name" in update_data:
            existing = existing.filter(tag_model.Tag.name == update_data["name"])
        elif "slug" in update_data:
            existing = existing.filter(tag_model.Tag.slug == update_data["slug"])
        
        if existing.first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tag with this name or slug already exists"
            )
    
    # Update fields
    for field, value in update_data.items():
        setattr(tag, field, value)
    
    db.commit()
    db.refresh(tag)
    
    return tag


@router.delete("/tags/{tag_id}")
def delete_tag(
    tag_id: int,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tag = db.query(tag_model.Tag).filter(
        tag_model.Tag.id == tag_id
    ).first()
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    # Check if tag is used in any posts
    posts_count = db.query(post_model.Post).filter(
        post_model.Post.tags.any(tag_model.Tag.id == tag_id)
    ).count()
    
    if posts_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete tag. It is used in {posts_count} post(s)."
        )
    
    db.delete(tag)
    db.commit()
    
    return {"message": "Tag deleted successfully"}


# Images
@router.get("/images", response_model=List[Image])
def get_all_images(
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    images = db.query(image_model.Image).order_by(
        image_model.Image.created_at.desc()
    ).all()
    return images


@router.get("/images/{image_id}", response_model=Image)
def get_image(
    image_id: int,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    image = db.query(image_model.Image).filter(
        image_model.Image.id == image_id
    ).first()
    
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    return image


@router.post("/images/upload", response_model=ImageUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    alt_text: str = None,
    caption: str = None,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only images are allowed."
        )
    
    # Validate file size (5MB max)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size too large. Maximum 5MB allowed."
        )
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Create uploads directory if it doesn't exist
    upload_dir = "uploads/images"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save file
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Process image with Pillow for optimization and thumbnail creation
    try:
        # Open and process the image
        with PILImage.open(io.BytesIO(content)) as img:
            # Convert RGBA to RGB if necessary (for JPEG compatibility)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Create a white background
                rgb_img = PILImage.new('RGB', img.size, (255, 255, 255))
                # Paste the image on the white background
                if img.mode == 'P':
                    img = img.convert('RGBA')
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = rgb_img
            
            # Get original dimensions
            width, height = img.size
            
            # Save optimized original image
            img.save(file_path, quality=85, optimize=True)
            
            # Create thumbnail directory
            thumb_dir = os.path.join(upload_dir, "thumbnails")
            os.makedirs(thumb_dir, exist_ok=True)
            
            # Generate thumbnails
            thumbnail_sizes = {
                'small': (150, 150),
                'medium': (300, 300),
                'large': (800, 800)
            }
            
            for size_name, (max_width, max_height) in thumbnail_sizes.items():
                # Create a copy for thumbnail
                thumb_img = img.copy()
                
                # Calculate thumbnail size maintaining aspect ratio
                thumb_img.thumbnail((max_width, max_height), PILImage.Resampling.LANCZOS)
                
                # Save thumbnail
                thumb_filename = f"{os.path.splitext(unique_filename)[0]}_{size_name}{file_extension}"
                thumb_path = os.path.join(thumb_dir, thumb_filename)
                thumb_img.save(thumb_path, quality=85, optimize=True)
                
    except Exception as e:
        # If image processing fails, save the original file
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        # Try to get dimensions from the saved file
        try:
            with PILImage.open(file_path) as img:
                width, height = img.size
        except Exception:
            width = height = None
    
    # Generate alt text from filename if not provided
    if not alt_text and file.filename:
        # Remove extension and replace separators with spaces
        alt_text = os.path.splitext(file.filename)[0].replace('_', ' ').replace('-', ' ')
    
    # Create image record in database
    image_data = ImageCreate(
        filename=unique_filename,
        original_name=file.filename or unique_filename,
        alt_text=alt_text,
        caption=caption,
        file_size=len(content),
        width=width,
        height=height,
        mime_type=file.content_type
    )
    
    image = image_model.Image(**image_data.model_dump())
    db.add(image)
    db.commit()
    db.refresh(image)
    
    return ImageUploadResponse(
        id=image.id,
        filename=unique_filename,
        url=f"/uploads/images/{unique_filename}",
        message="Image uploaded successfully"
    )


@router.put("/images/{image_id}", response_model=Image)
def update_image(
    image_id: int,
    image_in: ImageUpdate,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    image = db.query(image_model.Image).filter(
        image_model.Image.id == image_id
    ).first()
    
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    # Update fields
    update_data = image_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(image, field, value)
    
    db.commit()
    db.refresh(image)
    
    return image


@router.delete("/images/{image_id}")
def delete_image(
    image_id: int,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    image = db.query(image_model.Image).filter(
        image_model.Image.id == image_id
    ).first()
    
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    # Check if image is used as featured image in any posts
    posts_using_image = db.query(post_model.Post).filter(
        post_model.Post.featured_image_id == image_id
    ).count()
    
    if posts_using_image > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete image. It is used as featured image in {posts_using_image} post(s)."
        )
    
    # Delete the actual file
    file_path = os.path.join("uploads/images", image.filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Delete database record
    db.delete(image)
    db.commit()
    
    return {"message": "Image deleted successfully"}


# Backward compatibility - keep old upload endpoint
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Use the new upload_image function for backward compatibility
    result = await upload_image(file=file, current_user=current_user, db=db)
    return {"filename": result.filename, "url": result.url}