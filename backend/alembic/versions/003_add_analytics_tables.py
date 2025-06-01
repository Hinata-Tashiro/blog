"""Add analytics tables for dashboard functionality

Revision ID: 003
Revises: 002
Create Date: 2025-06-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    # Create page_views table
    op.create_table('page_views',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('post_id', sa.Integer(), nullable=True),
    sa.Column('url_path', sa.String(500), nullable=False),
    sa.Column('ip_address', sa.String(45), nullable=True),
    sa.Column('user_agent', sa.Text(), nullable=True),
    sa.Column('referrer', sa.String(1000), nullable=True),
    sa.Column('session_id', sa.String(255), nullable=True),
    sa.Column('country', sa.String(100), nullable=True),
    sa.Column('city', sa.String(100), nullable=True),
    sa.Column('device_type', sa.String(50), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_page_views_post_id', 'page_views', ['post_id'], unique=False)
    op.create_index('ix_page_views_url_path', 'page_views', ['url_path'], unique=False)
    op.create_index('ix_page_views_session_id', 'page_views', ['session_id'], unique=False)
    op.create_index('ix_page_views_created_at', 'page_views', ['created_at'], unique=False)
    
    # Create site_statistics table
    op.create_table('site_statistics',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('date', sa.Date(), nullable=False),
    sa.Column('total_views', sa.Integer(), nullable=True),
    sa.Column('unique_visitors', sa.Integer(), nullable=True),
    sa.Column('posts_published', sa.Integer(), nullable=True),
    sa.Column('total_posts', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('date')
    )
    op.create_index('ix_site_statistics_date', 'site_statistics', ['date'], unique=False)
    
    # Create popular_posts table
    op.create_table('popular_posts',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('post_id', sa.Integer(), nullable=False),
    sa.Column('date', sa.Date(), nullable=False),
    sa.Column('views_count', sa.Integer(), nullable=True),
    sa.Column('unique_views', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_popular_posts_post_id', 'popular_posts', ['post_id'], unique=False)
    op.create_index('ix_popular_posts_date', 'popular_posts', ['date'], unique=False)


def downgrade():
    # Drop popular_posts table
    op.drop_index('ix_popular_posts_date', table_name='popular_posts')
    op.drop_index('ix_popular_posts_post_id', table_name='popular_posts')
    op.drop_table('popular_posts')
    
    # Drop site_statistics table
    op.drop_index('ix_site_statistics_date', table_name='site_statistics')
    op.drop_table('site_statistics')
    
    # Drop page_views table
    op.drop_index('ix_page_views_created_at', table_name='page_views')
    op.drop_index('ix_page_views_session_id', table_name='page_views')
    op.drop_index('ix_page_views_url_path', table_name='page_views')
    op.drop_index('ix_page_views_post_id', table_name='page_views')
    op.drop_table('page_views')