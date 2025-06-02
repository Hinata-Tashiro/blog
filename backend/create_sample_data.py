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
        
        # 最初のユーザーを取得（管理者）
        admin_user = db.query(User).first()
        if not admin_user:
            print("No user found. Please run create_admin.py first.")
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
            },
            {
                "title": "Next.js 15 App Routerの完全ガイド",
                "slug": "nextjs-15-app-router-complete-guide",
                "content": """# Next.js 15 App Routerの完全ガイド

Next.js 15のApp Routerは、Reactアプリケーションの開発方法を大きく変える革新的な機能です。本記事では、App Routerの基本から応用まで、実践的な例を交えながら詳しく解説します。

## App Routerとは

App RouterはNext.js 13で導入された新しいルーティングシステムで、React Server Components（RSC）をベースに構築されています。従来のPages Routerと比較して、以下のような特徴があります：

- **React Server Components**のネイティブサポート
- **レイアウトのネスト**による効率的なUI構築
- **ストリーミング**による段階的なレンダリング
- **より細かい制御**が可能なデータフェッチング

## ディレクトリ構造

App Routerでは、`app`ディレクトリ内のフォルダ構造がそのままURLパスにマッピングされます。

```
app/
├── layout.tsx       # ルートレイアウト
├── page.tsx         # ホームページ
├── posts/
│   ├── layout.tsx   # 記事セクションのレイアウト
│   ├── page.tsx     # 記事一覧ページ
│   └── [slug]/
│       └── page.tsx # 記事詳細ページ
└── admin/
    ├── layout.tsx   # 管理画面レイアウト
    └── page.tsx     # 管理画面ダッシュボード
```

### 特殊なファイル名

App Routerでは、特定のファイル名が特別な意味を持ちます：

- **`page.tsx`**: ルートのメインコンテンツを定義
- **`layout.tsx`**: 共通レイアウトを定義
- **`loading.tsx`**: ローディング状態のUI
- **`error.tsx`**: エラーハンドリング
- **`not-found.tsx`**: 404ページ

## Server ComponentsとClient Components

### Server Components（デフォルト）

```typescript
// app/posts/page.tsx
async function PostsPage() {
  // サーバーサイドでデータを取得
  const posts = await fetch('https://api.example.com/posts', {
    cache: 'no-store' // リアルタイムデータ
  }).then(res => res.json());

  return (
    <div>
      <h1>記事一覧</h1>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
```

### Client Components

```typescript
'use client'; // この宣言でClient Componentになる

import { useState } from 'react';

export function SearchBar() {
  const [query, setQuery] = useState('');

  return (
    <input
      type="search"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="記事を検索..."
    />
  );
}
```

## データフェッチングパターン

### 並列データフェッチング

```typescript
async function Dashboard() {
  // 並列でデータを取得
  const [posts, users, stats] = await Promise.all([
    fetchPosts(),
    fetchUsers(),
    fetchStats()
  ]);

  return (
    <div>
      <PostsList posts={posts} />
      <UsersList users={users} />
      <StatsWidget stats={stats} />
    </div>
  );
}
```

### ストリーミングとSuspense

```typescript
import { Suspense } from 'react';

export default function PostPage() {
  return (
    <div>
      <h1>記事詳細</h1>
      <Suspense fallback={<PostSkeleton />}>
        <PostContent />
      </Suspense>
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
    </div>
  );
}
```

## レイアウトのネスト

レイアウトを使用することで、ページ間で共通のUIを効率的に共有できます：

```typescript
// app/posts/layout.tsx
export default function PostsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-12 gap-8">
      <aside className="col-span-3">
        <CategoryList />
      </aside>
      <main className="col-span-9">
        {children}
      </main>
    </div>
  );
}
```

## エラーハンドリング

```typescript
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>エラーが発生しました</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>もう一度試す</button>
    </div>
  );
}
```

## メタデータの管理

```typescript
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next.js 15 App Router完全ガイド',
  description: 'App Routerの基本から応用まで詳しく解説',
  openGraph: {
    title: 'Next.js 15 App Router完全ガイド',
    description: 'App Routerの基本から応用まで詳しく解説',
    images: ['/og-image.jpg'],
  },
};
```

## パフォーマンス最適化

### 部分的な事前レンダリング（PPR）

```typescript
export const experimental_ppr = true;

export default async function Page() {
  return (
    <div>
      {/* 静的コンテンツ */}
      <header>
        <h1>ブログタイトル</h1>
      </header>
      
      {/* 動的コンテンツ */}
      <Suspense fallback={<Loading />}>
        <DynamicContent />
      </Suspense>
    </div>
  );
}
```

## まとめ

Next.js 15のApp Routerは、モダンなWebアプリケーション開発に必要な機能を網羅しており、開発者体験とパフォーマンスの両方を大幅に向上させます。Server ComponentsとClient Componentsを適切に使い分けることで、高速でSEOフレンドリーなアプリケーションを構築できます。

今後もApp Routerは進化を続けていくと予想されるため、公式ドキュメントや最新の情報を定期的にチェックすることをお勧めします。""",
                "excerpt": "Next.js 15のApp Routerについて、基本概念から実践的な使い方まで包括的に解説します。",
                "status": PostStatus.PUBLISHED,
                "categories": [categories[1]],
                "tags": [tags[1], tags[5]],
                "published_at": datetime.now(timezone.utc)
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