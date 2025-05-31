# API仕様書

## 概要

このドキュメントは、Personal Technical Blog SystemのREST API仕様を記載しています。

- **ベースURL**: `http://localhost/api` (開発環境)
- **認証方式**: Bearer Token (JWT)
- **レスポンス形式**: JSON

## 認証

### ログイン
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**レスポンス**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### ログアウト
```http
POST /auth/logout
Authorization: Bearer {access_token}
```

### 現在のユーザー情報取得
```http
GET /auth/me
Authorization: Bearer {access_token}
```

**レスポンス**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "created_at": "2025-05-31T13:08:18",
  "updated_at": "2025-05-31T13:08:18"
}
```

## 記事 (Posts)

### 記事一覧取得
```http
GET /posts?skip=0&limit=10&category_id=1&tag_id=2&status=published
```

**パラメータ**
- `skip`: オフセット (デフォルト: 0)
- `limit`: 取得件数 (デフォルト: 10、最大: 100)
- `category_id`: カテゴリーID (オプション)
- `tag_id`: タグID (オプション)
- `status`: ステータス (published/draft、オプション)

**レスポンス**
```json
[
  {
    "id": 1,
    "title": "記事タイトル",
    "slug": "article-slug",
    "content": "# 記事内容\n\nMarkdown形式の本文...",
    "excerpt": "記事の概要",
    "status": "published",
    "category": {
      "id": 1,
      "name": "Python",
      "slug": "python"
    },
    "tags": [
      {
        "id": 1,
        "name": "FastAPI",
        "slug": "fastapi"
      }
    ],
    "author": {
      "id": 1,
      "username": "admin"
    },
    "created_at": "2025-05-31T13:08:18",
    "updated_at": "2025-05-31T13:08:18",
    "published_at": "2025-05-31T13:08:18"
  }
]
```

### 記事詳細取得
```http
GET /posts/{id}
```

### 記事作成（要認証）
```http
POST /posts
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "新しい記事",
  "slug": "new-article",
  "content": "# 記事内容\n\nMarkdown形式の本文",
  "excerpt": "記事の概要",
  "status": "draft",
  "category_id": 1,
  "tag_ids": [1, 2]
}
```

### 記事更新（要認証）
```http
PUT /posts/{id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "更新された記事タイトル",
  "content": "更新された内容",
  "status": "published"
}
```

### 記事削除（要認証）
```http
DELETE /posts/{id}
Authorization: Bearer {access_token}
```

## カテゴリー (Categories)

### カテゴリー一覧取得
```http
GET /categories
```

**レスポンス**
```json
[
  {
    "id": 1,
    "name": "Python",
    "slug": "python",
    "description": "Python関連の記事",
    "created_at": "2025-05-31T13:08:18"
  }
]
```

### カテゴリー作成（要認証）
```http
POST /categories
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "JavaScript",
  "slug": "javascript",
  "description": "JavaScript関連の記事"
}
```

### カテゴリー更新（要認証）
```http
PUT /categories/{id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "JavaScript/TypeScript",
  "description": "JavaScript/TypeScript関連の記事"
}
```

### カテゴリー削除（要認証）
```http
DELETE /categories/{id}
Authorization: Bearer {access_token}
```

## タグ (Tags)

### タグ一覧取得
```http
GET /tags
```

**レスポンス**
```json
[
  {
    "id": 1,
    "name": "FastAPI",
    "slug": "fastapi",
    "created_at": "2025-05-31T13:08:18"
  }
]
```

### タグ作成（要認証）
```http
POST /tags
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Docker",
  "slug": "docker"
}
```

### タグ更新（要認証）
```http
PUT /tags/{id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Docker/Kubernetes"
}
```

### タグ削除（要認証）
```http
DELETE /tags/{id}
Authorization: Bearer {access_token}
```

## ファイルアップロード

### 画像アップロード（要認証）
```http
POST /upload/image
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

file: (binary)
```

**レスポンス**
```json
{
  "filename": "image-12345.jpg",
  "url": "/uploads/images/image-12345.jpg"
}
```

## エラーレスポンス

### 400 Bad Request
```json
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Item not found"
}
```

### 422 Unprocessable Entity
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## レート制限

現在、レート制限は実装されていませんが、将来的に以下のヘッダーが追加される可能性があります：

- `X-RateLimit-Limit`: 制限数
- `X-RateLimit-Remaining`: 残り回数
- `X-RateLimit-Reset`: リセット時刻

## CORS設定

開発環境では以下のオリジンが許可されています：
- http://localhost
- http://localhost:3000

本番環境では適切なドメインのみを許可するよう設定してください。