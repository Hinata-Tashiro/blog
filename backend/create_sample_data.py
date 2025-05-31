"""
サンプルデータを作成するスクリプト
使用方法: python create_sample_data.py
"""
from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models.user import User
from app.models.post import Post, PostStatus
from app.models.category import Category
from app.models.tag import Tag
from app.core.security import get_password_hash
from datetime import datetime, timezone

def create_sample_data():
    db = SessionLocal()
    
    try:
        # サンプルカテゴリを作成
        categories_data = [
            {"name": "プログラミング", "slug": "programming"},
            {"name": "Web開発", "slug": "web-development"},
            {"name": "データベース", "slug": "database"},
            {"name": "インフラ", "slug": "infrastructure"},
        ]
        
        categories = []
        for cat_data in categories_data:
            cat = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
            if not cat:
                cat = Category(**cat_data)
                db.add(cat)
                db.commit()
                db.refresh(cat)
            categories.append(cat)
        
        # サンプルタグを作成
        tags_data = [
            {"name": "Python", "slug": "python"},
            {"name": "JavaScript", "slug": "javascript"},
            {"name": "Docker", "slug": "docker"},
            {"name": "MySQL", "slug": "mysql"},
            {"name": "FastAPI", "slug": "fastapi"},
            {"name": "Next.js", "slug": "nextjs"},
        ]
        
        tags = []
        for tag_data in tags_data:
            tag = db.query(Tag).filter(Tag.slug == tag_data["slug"]).first()
            if not tag:
                tag = Tag(**tag_data)
                db.add(tag)
                db.commit()
                db.refresh(tag)
            tags.append(tag)
        
        # adminユーザーを取得
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("Admin user not found. Please run create_admin.py first.")
            return
        
        # サンプル記事を作成
        posts_data = [
            {
                "title": "FastAPIとNext.jsで作るモダンなブログシステム",
                "slug": "fastapi-nextjs-blog-system",
                "content": """# FastAPIとNext.jsで作るモダンなブログシステム

本記事では、FastAPIとNext.jsを使用してモダンなブログシステムを構築する方法について解説します。

## 技術スタック

- **バックエンド**: FastAPI (Python)
- **フロントエンド**: Next.js 15 (TypeScript)
- **データベース**: MySQL 8.0
- **スタイリング**: Tailwind CSS + shadcn/ui
- **インフラ**: Docker

## なぜこの組み合わせ？

### FastAPIの利点
- 高速なパフォーマンス
- 自動的なAPIドキュメント生成
- 型安全性
- 非同期処理のサポート

### Next.jsの利点
- サーバーサイドレンダリング
- 優れた開発体験
- 最適化された本番ビルド
- App Routerによる柔軟なルーティング

## 実装のポイント

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

このようにCORSの設定を行うことで、フロントエンドとバックエンドの通信が可能になります。

## まとめ

FastAPIとNext.jsの組み合わせは、モダンなWebアプリケーション開発において非常に強力な選択肢です。""",
                "excerpt": "FastAPIとNext.jsを使用してモダンなブログシステムを構築する方法について解説します。",
                "status": PostStatus.PUBLISHED,
                "categories": [categories[0], categories[1]],
                "tags": [tags[0], tags[4], tags[5]],
                "published_at": datetime.now(timezone.utc)
            },
            {
                "title": "Dockerを使った開発環境の構築",
                "slug": "docker-development-environment",
                "content": """# Dockerを使った開発環境の構築

Dockerを使用することで、チーム全体で統一された開発環境を簡単に構築できます。

## Docker Composeの設定

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=mysql://root:password@db:3306/blog
    depends_on:
      - db

  frontend:
    build: ./frontend
    volumes:
      - ./frontend:/app
    ports:
      - "3000:3000"

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=blog
```

## メリット

1. **環境の一貫性**: 開発環境と本番環境の差異を最小限に
2. **簡単なセットアップ**: `docker-compose up`だけで環境構築完了
3. **依存関係の管理**: 各サービスの依存関係を明確に定義

## ベストプラクティス

- マルチステージビルドを使用してイメージサイズを削減
- 開発用と本番用のDockerfileを分ける
- ボリュームマウントで開発時のホットリロードを実現

Dockerを活用することで、効率的な開発が可能になります。""",
                "excerpt": "Dockerを使用して統一された開発環境を構築する方法とベストプラクティスを紹介します。",
                "status": PostStatus.PUBLISHED,
                "categories": [categories[3]],
                "tags": [tags[2]],
                "published_at": datetime.now(timezone.utc)
            },
            {
                "title": "MySQLのパフォーマンスチューニング基礎",
                "slug": "mysql-performance-tuning-basics",
                "content": """# MySQLのパフォーマンスチューニング基礎

MySQLのパフォーマンスを向上させるための基本的なチューニング方法を解説します。

## インデックスの重要性

適切なインデックスの設定は、クエリのパフォーマンスを大幅に向上させます。

```sql
-- 検索によく使用される列にインデックスを作成
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status_published ON posts(status, published_at);
```

## クエリの最適化

EXPLAINを使用してクエリの実行計画を確認：

```sql
EXPLAIN SELECT * FROM posts 
WHERE status = 'published' 
ORDER BY published_at DESC 
LIMIT 10;
```

## 設定の調整

my.cnfでの重要な設定項目：

```ini
[mysqld]
innodb_buffer_pool_size = 1G
max_connections = 200
query_cache_size = 32M
```

適切なチューニングにより、アプリケーションのレスポンスが大幅に改善されます。""",
                "excerpt": "MySQLのパフォーマンスを向上させるための基本的なチューニング方法を解説します。",
                "status": PostStatus.DRAFT,
                "categories": [categories[2]],
                "tags": [tags[3]],
                "published_at": None
            }
        ]
        
        for post_data in posts_data:
            # Extract relationships
            post_categories = post_data.pop("categories", [])
            post_tags = post_data.pop("tags", [])
            
            # Check if post exists
            existing_post = db.query(Post).filter(Post.slug == post_data["slug"]).first()
            if not existing_post:
                # Create post
                post = Post(**post_data, user_id=admin_user.id)
                
                # Add relationships
                post.categories = post_categories
                post.tags = post_tags
                
                db.add(post)
                db.commit()
        
        print("Sample data created successfully!")
        print(f"- Categories: {len(categories)}")
        print(f"- Tags: {len(tags)}")
        print(f"- Posts: {len(posts_data)}")
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data()