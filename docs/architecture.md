# システムアーキテクチャ

## 全体構成

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│    Nginx    │────▶│  Frontend   │
│             │     │  (Reverse   │     │  (Next.js)  │
└─────────────┘     │   Proxy)    │     └─────────────┘
                    │             │
                    │             │     ┌─────────────┐
                    │             │────▶│   Backend   │
                    │             │     │  (FastAPI)  │
                    └─────────────┘     └──────┬──────┘
                                               │
                                        ┌──────▼──────┐
                                        │    MySQL    │
                                        │  Database   │
                                        └─────────────┘
```

## コンポーネント詳細

### Nginx (リバースプロキシ)
- **役割**: 
  - HTTPSターミネーション
  - ロードバランシング
  - 静的ファイル配信
  - APIとフロントエンドへのルーティング
- **設定ファイル**: `nginx/nginx.conf`

### Frontend (Next.js)
- **技術スタック**:
  - Next.js 15.1.3 (App Router)
  - TypeScript
  - Tailwind CSS
  - shadcn/ui
  - Zustand (状態管理)
- **主要機能**:
  - SSR/SSG対応
  - 記事一覧・詳細表示
  - 管理画面UI
  - Markdownプレビュー

### Backend (FastAPI)
- **技術スタック**:
  - FastAPI
  - SQLAlchemy (ORM)
  - Alembic (マイグレーション)
  - PyJWT (認証)
  - Pydantic (データ検証)
- **主要機能**:
  - REST API提供
  - JWT認証
  - データベース操作
  - ファイルアップロード

### Database (MySQL)
- **バージョン**: 8.0
- **文字コード**: utf8mb4
- **主要テーブル**:
  - users: ユーザー情報
  - posts: 記事データ
  - categories: カテゴリー
  - tags: タグ
  - post_tags: 記事-タグ関連

## データフロー

### 認証フロー
```
1. ユーザー → ログインフォーム入力
2. Frontend → POST /api/auth/login
3. Backend → ユーザー検証
4. Backend → JWTトークン生成
5. Frontend → トークンをlocalStorageに保存
6. 以降のリクエストでAuthorizationヘッダーに含める
```

### 記事投稿フロー
```
1. 管理者 → 記事作成フォーム入力
2. Frontend → POST /api/posts (JWT付き)
3. Backend → 認証確認
4. Backend → データ検証
5. Backend → データベースに保存
6. Backend → レスポンス返却
7. Frontend → 成功通知表示
```

## ディレクトリ構造

```
blog/
├── backend/
│   ├── app/
│   │   ├── api/          # APIルート定義
│   │   │   ├── auth.py   # 認証エンドポイント
│   │   │   ├── posts.py  # 記事エンドポイント
│   │   │   ├── categories.py
│   │   │   └── tags.py
│   │   ├── core/         # コア機能
│   │   │   ├── config.py # 設定管理
│   │   │   └── security.py # セキュリティ関連
│   │   ├── db/           # データベース
│   │   │   ├── base.py   # ベースクラス
│   │   │   └── session.py # セッション管理
│   │   ├── models/       # ORMモデル
│   │   └── schemas/      # Pydanticスキーマ
│   ├── alembic/          # マイグレーション
│   └── uploads/          # アップロードファイル
│
├── frontend/
│   ├── app/              # Next.js App Router
│   │   ├── (blog)/       # ブログ公開側
│   │   │   ├── page.tsx  # トップページ
│   │   │   └── posts/    # 記事詳細
│   │   └── admin/        # 管理画面
│   │       ├── login/    # ログイン
│   │       └── posts/    # 記事管理
│   ├── components/       # 共通コンポーネント
│   └── lib/              # ユーティリティ
│
└── nginx/                # Nginx設定
```

## セキュリティ考慮

### 認証・認可
- JWT (JSON Web Token) を使用
- トークンの有効期限設定
- パスワードはbcryptでハッシュ化

### 入力検証
- Pydanticによるデータ検証
- SQLインジェクション対策 (SQLAlchemy ORM)
- XSS対策 (React自動エスケープ)

### CORS設定
- 開発環境: localhost許可
- 本番環境: 特定ドメインのみ許可

### HTTPS
- 本番環境では必須
- Let's Encryptによる証明書取得

## スケーラビリティ

### 水平スケーリング
- Dockerコンテナによる容易なスケールアウト
- ロードバランサー追加可能

### キャッシュ戦略
- 静的ファイルのブラウザキャッシュ
- Next.jsの自動最適化
- 将来的にRedis追加可能

### データベース最適化
- インデックスの適切な設定
- クエリの最適化
- 読み取り専用レプリカの追加可能

## 監視とロギング

### アプリケーションログ
- FastAPI: uvicornログ
- Next.js: コンソールログ
- Nginx: アクセスログ、エラーログ

### メトリクス
- Docker stats でリソース使用状況確認
- 将来的にPrometheus/Grafana導入可能

### ヘルスチェック
- `/api/health` エンドポイント
- Docker内蔵ヘルスチェック機能

## 開発ワークフロー

### ローカル開発
1. `docker-compose up` で全サービス起動
2. ホットリロード有効
3. ボリュームマウントでコード変更即反映

### CI/CD考慮
- Dockerイメージのビルド
- 自動テスト実行
- ステージング環境へのデプロイ
- 本番環境へのデプロイ

## 将来の拡張性

### 機能追加の容易性
- モジュラー設計
- 明確な責任分離
- RESTful API設計

### 技術スタックの拡張
- GraphQL対応可能
- WebSocket対応可能
- マイクロサービス化可能