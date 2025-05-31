#!/bin/bash

echo "🚀 ブログシステムを起動します..."

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Dockerがインストールされていません"
    echo "Dockerをインストールしてから再度実行してください"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Composeがインストールされていません"
    echo "Docker Composeをインストールしてから再度実行してください"
    exit 1
fi

# Create necessary directories
echo "📁 必要なディレクトリを作成しています..."
mkdir -p backend/uploads
mkdir -p nginx/ssl

# Copy environment files if they don't exist
if [ ! -f .env ]; then
    echo "📝 環境変数ファイルを作成しています..."
    cp .env.example .env
fi

if [ ! -f backend/.env ]; then
    cp backend/.env backend/.env
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.local frontend/.env.local
fi

# Build and start containers
echo "🔨 Dockerイメージをビルドしています..."
docker-compose build

echo "🚀 コンテナを起動しています..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ データベースの起動を待っています..."
sleep 15

# Initialize database
echo "🗄️ データベースを初期化しています..."
docker-compose exec -T backend bash -c "cd /app && alembic upgrade head"

# Create admin user
echo "👤 管理者ユーザーを作成しています..."
docker-compose exec -T backend python create_admin.py

# Create sample data
echo "📝 サンプルデータを作成しています..."
docker-compose exec -T backend python create_sample_data.py

echo "✅ セットアップが完了しました！"
echo ""
echo "🌐 アクセスURL:"
echo "  - ブログ: http://localhost"
echo "  - 管理画面: http://localhost/admin/login"
echo "  - API ドキュメント: http://localhost/api/docs"
echo ""
echo "📧 初期ログイン情報:"
echo "  - ユーザー名: admin"
echo "  - パスワード: admin123"
echo ""
echo "⚠️  初回ログイン後は必ずパスワードを変更してください！"
echo ""
echo "🛑 停止するには: docker-compose down"