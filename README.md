# Personal Technical Blog System

個人技術ブログシステム - FastAPI (Python) + Next.js + MySQL

## 概要

このプロジェクトは、技術記事の執筆と公開に特化した個人ブログシステムです。wp-adminのような管理画面を持ち、Markdownでの記事執筆、カテゴリー・タグ管理、画像アップロードなどの機能を提供します。

## 主な機能

### 公開側（ブログ閲覧）
- 記事一覧表示（ページネーション対応）
- 記事詳細表示（Markdown→HTMLレンダリング）
- カテゴリー・タグ別記事フィルタリング
- レスポンシブデザイン

### 管理側（ブログ管理）
- 認証付き管理画面
- 記事の作成・編集・削除
- Markdownエディタ（プレビュー機能付き）
- カテゴリー・タグ管理
- 画像アップロード機能
- 記事の下書き・公開管理

## 技術スタック

### バックエンド
- **言語**: Python 3.12
- **フレームワーク**: FastAPI
- **ORM**: SQLAlchemy
- **認証**: JWT (PyJWT)
- **データベース**: MySQL 8.0

### フロントエンド
- **フレームワーク**: Next.js 15.1.3
- **言語**: TypeScript
- **UIライブラリ**: shadcn/ui
- **スタイリング**: Tailwind CSS
- **状態管理**: Zustand
- **フォーム**: React Hook Form + Zod

### インフラ
- **コンテナ**: Docker & Docker Compose
- **Webサーバー**: Nginx（リバースプロキシ）
- **開発環境**: ホットリロード対応

## プロジェクト構成

```
blog/
├── backend/                 # バックエンドAPI
│   ├── app/
│   │   ├── api/            # APIエンドポイント
│   │   ├── core/           # 設定・セキュリティ
│   │   ├── db/             # データベース関連
│   │   ├── models/         # SQLAlchemyモデル
│   │   └── schemas/        # Pydanticスキーマ
│   ├── alembic/            # DBマイグレーション
│   ├── uploads/            # アップロードファイル
│   └── requirements.txt
├── frontend/               # フロントエンド
│   ├── app/               # Next.js App Router
│   │   ├── (blog)/        # ブログ公開側
│   │   └── admin/         # 管理画面
│   ├── components/        # UIコンポーネント
│   ├── lib/              # ユーティリティ
│   └── package.json
├── nginx/                 # Nginx設定
├── docker-compose.yml     # Docker構成
└── docs/                  # ドキュメント
```

## クイックスタート

### 前提条件
- Docker & Docker Compose がインストールされていること
- ポート 80, 3000, 3306, 8000 が使用可能であること

### セットアップ手順

1. リポジトリのクローン
```bash
git clone <repository-url>
cd blog
```

2. Dockerコンテナの起動
```bash
docker-compose up -d
```

3. アクセス
- ブログ: http://localhost
- 管理画面: http://localhost/admin
- API: http://localhost/api

### デフォルト管理者アカウント
- **ユーザー名**: admin
- **パスワード**: admin123

⚠️ **重要**: 本番環境では必ずパスワードを変更してください

## 開発環境

### バックエンドの開発
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### フロントエンドの開発
```bash
cd frontend
npm install
npm run dev
```

### データベースマイグレーション
```bash
cd backend
alembic upgrade head
```

## API仕様

主要なAPIエンドポイント：

### 認証
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 現在のユーザー情報

### 記事
- `GET /api/posts` - 記事一覧
- `GET /api/posts/{id}` - 記事詳細
- `POST /api/posts` - 記事作成（要認証）
- `PUT /api/posts/{id}` - 記事更新（要認証）
- `DELETE /api/posts/{id}` - 記事削除（要認証）

### カテゴリー・タグ
- `GET /api/categories` - カテゴリー一覧
- `GET /api/tags` - タグ一覧

詳細は [API仕様書](docs/api-specification.md) を参照

## 環境変数

### バックエンド
- `DATABASE_URL`: データベース接続URL
- `JWT_SECRET`: JWT署名用シークレットキー
- `CORS_ORIGINS`: 許可するCORSオリジン

### フロントエンド
- `NEXT_PUBLIC_API_URL`: APIエンドポイントURL

## セキュリティ考慮事項

1. 本番環境では必ず以下を変更してください：
   - データベースのパスワード
   - JWT_SECRET
   - 管理者パスワード

2. HTTPS化を推奨します
3. 適切なファイアウォール設定を行ってください

## トラブルシューティング

[トラブルシューティングガイド](docs/troubleshooting.md) を参照

## ライセンス

このプロジェクトはプライベートプロジェクトです。

## 作成者

個人技術ブログプロジェクト