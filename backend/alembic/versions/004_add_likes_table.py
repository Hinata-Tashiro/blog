"""add likes table

Revision ID: 004
Revises: 003
Create Date: 2025-01-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    # Create likes table (anonymous likes allowed)
    op.create_table('likes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('post_id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.String(255), nullable=True),  # Optional session ID from frontend
        sa.Column('ip_address', sa.String(45), nullable=True),  # Optional IP tracking
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_likes_post_id'), 'likes', ['post_id'], unique=False)
    op.create_index(op.f('ix_likes_created_at'), 'likes', ['created_at'], unique=False)


def downgrade():
    # Drop indexes
    op.drop_index(op.f('ix_likes_created_at'), table_name='likes')
    op.drop_index(op.f('ix_likes_post_id'), table_name='likes')
    
    # Drop table
    op.drop_table('likes')