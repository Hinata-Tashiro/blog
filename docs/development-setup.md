# 開発環境セットアップガイド

## 必要な環境

- Docker Desktop (Mac/Windows) または Docker Engine (Linux)
- Docker Compose v2.0以上
- Git
- お好みのコードエディタ（VS Code推奨）

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd blog
```

### 2. 環境変数の設定（オプション）

デフォルト設定で動作しますが、必要に応じて環境変数を設定できます。

`docker-compose.yml`内の環境変数：

```yaml
backend:
  environment:
    - DATABASE_URL=mysql+pymysql://root:password@db:3306/blog
    - JWT_SECRET=your-secret-key-change-this-in-production
    - CORS_ORIGINS=http://localhost,http://localhost:3000

frontend:
  environment:
    - NEXT_PUBLIC_API_URL=http://localhost/api
```

### 3. Dockerコンテナの起動

```bash
# バックグラウンドで起動
docker-compose up -d

# ログを見ながら起動（推奨）
docker-compose up
```

初回起動時は以下の処理が自動的に実行されます：
- MySQLデータベースの初期化
- データベーススキーマの作成
- 管理者ユーザーの作成
- サンプルデータの投入

### 4. 動作確認

すべてのコンテナが正常に起動していることを確認：

```bash
docker-compose ps
```

期待される出力：
```
NAME              IMAGE           STATUS         PORTS
blog-backend-1    blog-backend    Up             8000/tcp
blog-db-1         mysql:8.0       Up             0.0.0.0:3306->3306/tcp
blog-frontend-1   blog-frontend   Up             0.0.0.0:3000->3000/tcp
blog-nginx-1      nginx:alpine    Up             0.0.0.0:80->80/tcp
```

### 5. アクセス確認

- **ブログトップ**: http://localhost
- **管理画面**: http://localhost/admin
- **API**: http://localhost/api/docs (Swagger UI)

管理画面のログイン情報：
- ユーザー名: `admin`
- パスワード: `admin123`

## 開発時の操作

### コンテナの停止

```bash
# 停止
docker-compose stop

# 停止して削除
docker-compose down

# ボリュームも含めて削除（データベースも削除される）
docker-compose down -v
```

### ログの確認

```bash
# 全サービスのログ
docker-compose logs

# 特定サービスのログ
docker-compose logs frontend
docker-compose logs backend

# リアルタイムでログを表示
docker-compose logs -f
```

### コンテナへの接続

```bash
# バックエンドコンテナ
docker-compose exec backend bash

# フロントエンドコンテナ
docker-compose exec frontend sh

# データベース
docker-compose exec db mysql -u root -ppassword blog
```

### コードの変更

- **バックエンド**: `backend/`配下のファイルを編集すると自動的にリロードされます
- **フロントエンド**: `frontend/`配下のファイルを編集すると自動的にリロードされます

### データベースのリセット

```bash
# データベースコンテナを削除して再作成
docker-compose down -v
docker-compose up -d db
docker-compose up -d
```

## ローカル開発（Docker未使用）

Dockerを使用せずに開発する場合：

### バックエンド

```bash
cd backend

# 仮想環境の作成
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係のインストール
pip install -r requirements.txt

# MySQLの起動（別途インストールが必要）
# データベースとユーザーを作成

# 環境変数の設定
export DATABASE_URL=mysql+pymysql://root:password@localhost:3306/blog
export JWT_SECRET=your-secret-key
export CORS_ORIGINS=http://localhost:3000

# マイグレーション
alembic upgrade head

# 管理者ユーザーの作成
python create_admin.py

# 開発サーバーの起動
uvicorn app.main:app --reload --port 8000
```

### フロントエンド

```bash
cd frontend

# 依存関係のインストール
npm install

# 環境変数の設定
export NEXT_PUBLIC_API_URL=http://localhost:8000

# 開発サーバーの起動
npm run dev
```

## VS Code推奨拡張機能

- **Python**: ms-python.python
- **Pylance**: ms-python.vscode-pylance
- **Docker**: ms-azuretools.vscode-docker
- **ESLint**: dbaeumer.vscode-eslint
- **Prettier**: esbenp.prettier-vscode
- **Tailwind CSS IntelliSense**: bradlc.vscode-tailwindcss

## トラブルシューティング

### ポートが使用中の場合

```bash
# 使用中のポートを確認
lsof -i :80    # Mac/Linux
netstat -ano | findstr :80  # Windows

# docker-compose.ymlでポートを変更
ports:
  - "8080:80"  # 80の代わりに8080を使用
```

### コンテナが起動しない場合

```bash
# ログを確認
docker-compose logs [サービス名]

# コンテナを再ビルド
docker-compose build --no-cache [サービス名]
docker-compose up -d
```

### データベース接続エラー

1. データベースコンテナが起動しているか確認
2. 環境変数DATABASE_URLが正しいか確認
3. ネットワーク設定を確認

```bash
# データベースへの接続テスト
docker-compose exec backend python -c "from app.db.session import engine; print(engine.connect())"
```

## 開発のヒント

1. **ホットリロード**: バックエンド・フロントエンドともに、ファイルを保存すると自動的に反映されます

2. **データベースGUI**: MySQL Workbench等を使用する場合
   - ホスト: localhost
   - ポート: 3306
   - ユーザー: root
   - パスワード: password

3. **API仕様の確認**: http://localhost/api/docs でSwagger UIが利用できます

4. **コミット前のチェック**:
   ```bash
   # バックエンドのテスト（未実装）
   docker-compose exec backend pytest
   
   # フロントエンドのリント
   docker-compose exec frontend npm run lint
   ```