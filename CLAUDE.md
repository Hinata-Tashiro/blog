# Personal Technical Blog System - 開発情報

## プロジェクト概要
個人技術ブログシステムの開発プロジェクト。FastAPI (Python) + Next.js + MySQL構成。

## 重要な決定事項
- **バックエンド**: Python (FastAPI) を使用（ユーザーの明示的な要望）
- **データベース**: MySQL を使用（PostgreSQLではない）
- **Docker**: 必須（開発・本番環境両方）
- **認証**: JWT方式、ユーザー名でログイン（メールアドレスではない）

## よくある問題と解決策

### ログイン問題
- デフォルトログイン情報:
  - ユーザー名: `admin` （`admin@example.com`ではない）
  - パスワード: `admin123`

### パッケージバージョン
動作確認済みバージョン:
- Next.js: 15.1.3 (15.3.3から下げた)
- React: 18.3.1 (19.0.0から下げた)
- Tailwind CSS: 3.4.15 (4.1.8から下げた)
- uvicorn: 0.34.0 (0.35.0は存在しない)

### データベース接続
- PyMySQLを使用（MySQLdbの代わり）
- 循環インポート回避のため、base.pyからモデルのインポートを削除

## 開発時のコマンド

### コンテナ操作
```bash
# 起動
docker-compose up -d

# ログ確認
docker-compose logs -f [サービス名]

# 再ビルド
docker-compose build --no-cache [サービス名]
```

### データベース確認
```bash
docker exec blog-db-1 mysql -u root -ppassword blog -e "SELECT * FROM users;"
```

## プロジェクト構造
- `/backend`: FastAPI アプリケーション
- `/frontend`: Next.js アプリケーション  
- `/nginx`: リバースプロキシ設定
- `/docs`: ドキュメント類

## 未実装機能
- カテゴリー・タグ管理UI
- パスワード変更機能
- 複数タグ選択（記事編集時）

## 開発時の注意事項
1. フロントエンドのDockerfileは開発用に簡略化されている
2. 本番環境では別途Dockerfile.productionを使用
3. CORS設定は環境に応じて変更が必要