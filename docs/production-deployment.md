# 本番環境デプロイガイド

## 前提条件

- Ubuntu Server 20.04 LTS以上
- Docker & Docker Composeインストール済み
- ドメイン名取得済み
- SSL証明書（Let's Encrypt推奨）

## セキュリティ設定

### 1. 環境変数の本番用設定

`.env.production`ファイルを作成：

```bash
# データベース設定
MYSQL_ROOT_PASSWORD=<強力なパスワード>
MYSQL_DATABASE=blog
DB_USER=bloguser
DB_PASSWORD=<強力なパスワード>

# JWT設定
JWT_SECRET=<ランダムな長い文字列>
# 生成例: openssl rand -hex 32

# 管理者設定
ADMIN_USERNAME=<管理者ユーザー名>
ADMIN_PASSWORD=<強力なパスワード>

# CORS設定
CORS_ORIGINS=https://yourdomain.com

# API URL
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

### 2. docker-compose.production.yml の作成

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.production.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./certbot/www:/var/www/certbot
    depends_on:
      - frontend
      - backend
    networks:
      - blog-network
    restart: always

  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile.production
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    expose:
      - "3000"
    networks:
      - blog-network
    restart: always

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=mysql+pymysql://${DB_USER}:${DB_PASSWORD}@db:3306/${MYSQL_DATABASE}
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGINS=${CORS_ORIGINS}
    expose:
      - "8000"
    volumes:
      - ./backend/uploads:/app/uploads
    networks:
      - blog-network
    depends_on:
      - db
    restart: always

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=${MYSQL_DATABASE}
      - MYSQL_USER=${DB_USER}
      - MYSQL_PASSWORD=${DB_PASSWORD}
      - MYSQL_CHARACTER_SET=utf8mb4
      - MYSQL_COLLATION=utf8mb4_unicode_ci
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - blog-network
    restart: always

volumes:
  mysql_data:

networks:
  blog-network:
    driver: bridge
```

### 3. Nginx本番設定

`nginx/nginx.production.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # セキュリティヘッダー
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # SSL設定
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Gzip圧縮
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # レート制限
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        listen 80;
        server_name yourdomain.com;
        
        # Let's Encrypt認証用
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        # HTTPSへリダイレクト
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # API
        location /api {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # アップロードファイル
        location /uploads {
            proxy_pass http://backend:8000/uploads;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # フロントエンド
        location / {
            proxy_pass http://frontend:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 4. フロントエンド本番用Dockerfile

`frontend/Dockerfile.production`:

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

## デプロイ手順

### 1. サーバーの準備

```bash
# システムアップデート
sudo apt update && sudo apt upgrade -y

# 必要なパッケージのインストール
sudo apt install -y docker.io docker-compose git

# ユーザーをdockerグループに追加
sudo usermod -aG docker $USER
newgrp docker
```

### 2. ファイアウォール設定

```bash
# UFWの設定
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable
```

### 3. プロジェクトのデプロイ

```bash
# プロジェクトのクローン
git clone <repository-url> /opt/blog
cd /opt/blog

# 環境変数の設定
cp .env.production .env

# SSL証明書の取得（Let's Encrypt）
docker run -it --rm \
  -v /opt/blog/certbot/www:/var/www/certbot \
  -v /opt/blog/nginx/ssl:/etc/letsencrypt \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com

# 本番環境の起動
docker-compose -f docker-compose.production.yml up -d
```

### 4. SSL証明書の自動更新

crontabに追加：

```bash
0 0 * * 0 docker run --rm -v /opt/blog/certbot/www:/var/www/certbot -v /opt/blog/nginx/ssl:/etc/letsencrypt certbot/certbot renew && docker-compose -f /opt/blog/docker-compose.production.yml restart nginx
```

## バックアップ

### データベースバックアップ

```bash
#!/bin/bash
# /opt/blog/scripts/backup.sh

BACKUP_DIR="/opt/blog/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="blog_db_1"

mkdir -p $BACKUP_DIR

# データベースのダンプ
docker exec $DB_CONTAINER mysqldump -u root -p${MYSQL_ROOT_PASSWORD} blog > $BACKUP_DIR/blog_$DATE.sql

# アップロードファイルのバックアップ
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/blog/backend/uploads

# 古いバックアップの削除（30日以上）
find $BACKUP_DIR -type f -mtime +30 -delete
```

crontabに追加：

```bash
0 2 * * * /opt/blog/scripts/backup.sh
```

## 監視

### ヘルスチェック

```bash
#!/bin/bash
# /opt/blog/scripts/health-check.sh

# APIヘルスチェック
if ! curl -f https://yourdomain.com/api/health; then
    echo "API is down" | mail -s "Blog API Alert" admin@example.com
fi

# フロントエンドチェック
if ! curl -f https://yourdomain.com; then
    echo "Frontend is down" | mail -s "Blog Frontend Alert" admin@example.com
fi
```

### ログ監視

```bash
# エラーログの確認
docker-compose -f docker-compose.production.yml logs --tail=100 | grep ERROR

# アクセスログの確認
docker-compose -f docker-compose.production.yml logs nginx | grep "404\|500"
```

## パフォーマンスチューニング

### 1. MySQLの最適化

`/opt/blog/mysql/my.cnf`:

```ini
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_file_per_table = 1
```

### 2. Nginxワーカープロセス

CPUコア数に応じて調整：

```nginx
worker_processes auto;
worker_rlimit_nofile 65535;
```

## セキュリティのベストプラクティス

1. **定期的なアップデート**
   ```bash
   docker-compose -f docker-compose.production.yml pull
   docker-compose -f docker-compose.production.yml up -d
   ```

2. **ログの監視**
   - fail2banの導入を検討
   - 異常なアクセスパターンの監視

3. **バックアップのテスト**
   - 定期的にリストアテストを実施

4. **アクセス制限**
   - 管理画面へのIPアドレス制限を検討

## トラブルシューティング

### コンテナが起動しない

```bash
# ログの確認
docker-compose -f docker-compose.production.yml logs [サービス名]

# 設定の検証
docker-compose -f docker-compose.production.yml config
```

### パフォーマンスが遅い

1. リソース使用状況の確認
   ```bash
   docker stats
   ```

2. スロークエリの確認
   ```bash
   docker exec blog_db_1 mysql -u root -p -e "SHOW PROCESSLIST;"
   ```

### ディスク容量不足

```bash
# 不要なイメージの削除
docker system prune -a

# ログファイルのローテーション設定
```