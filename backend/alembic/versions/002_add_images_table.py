"""Add images table and featured_image_id to posts

Revision ID: 002
Revises: 001
Create Date: 2025-01-06 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    # Create images table
    op.create_table('images',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('filename', sa.String(255), nullable=False),
    sa.Column('original_name', sa.String(255), nullable=False),
    sa.Column('alt_text', sa.String(500), nullable=True),
    sa.Column('caption', sa.Text(), nullable=True),
    sa.Column('file_size', sa.Integer(), nullable=True),
    sa.Column('width', sa.Integer(), nullable=True),
    sa.Column('height', sa.Integer(), nullable=True),
    sa.Column('mime_type', sa.String(100), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id', name='pk_images')
    )
    op.create_index('ix_images_id', 'images', ['id'], unique=False)
    op.create_index('ix_images_filename', 'images', ['filename'], unique=False)
    
    # Add featured_image_id to posts table
    op.add_column('posts', sa.Column('featured_image_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_posts_featured_image_id_images', 'posts', 'images', ['featured_image_id'], ['id'])


def downgrade():
    # Remove featured_image_id from posts table
    op.drop_constraint('fk_posts_featured_image_id_images', 'posts', type_='foreignkey')
    op.drop_column('posts', 'featured_image_id')
    
    # Drop images table
    op.drop_index('ix_images_filename', table_name='images')
    op.drop_index('ix_images_id', table_name='images')
    op.drop_table('images')