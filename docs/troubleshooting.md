# トラブルシューティングガイド

## よくある問題と解決方法

### ログイン関連

#### 問題: ログインできない
**症状**: 管理画面でログイン情報を入力しても「ユーザー名またはパスワードが正しくありません」と表示される

**原因と解決方法**:
1. **ユーザー名の間違い**: メールアドレスではなくユーザー名を入力してください
   - ✅ 正しい: `admin`
   - ❌ 間違い: `admin@example.com`

2. **パスワードの確認**: デフォルトパスワードは `admin123` です

3. **データベースの確認**:
   ```bash
   docker exec blog-db-1 mysql -u root -ppassword blog -e "SELECT username, email FROM users;"
   ```

### Docker関連

#### 問題: コンテナが起動しない

**frontend コンテナのエラー: "next: not found"**
```bash
# 解決方法
docker-compose down
docker-compose build frontend --no-cache
docker-compose up -d
```

**backend コンテナのエラー: "ModuleNotFoundError"**
```bash
# 依存関係の再インストール
docker-compose exec backend pip install -r requirements.txt
docker-compose restart backend
```

#### 問題: ポートが既に使用されている

**エラー**: "bind: address already in use"

**解決方法**:
```bash
# 使用中のプロセスを確認（Mac/Linux）
lsof -i :80
lsof -i :3000
lsof -i :3306

# プロセスを停止するか、docker-compose.ymlでポートを変更
ports:
  - "8080:80"  # 80の代わりに8080を使用
```

### データベース関連

#### 問題: データベース接続エラー

**エラー**: "Can't connect to MySQL server"

**解決方法**:
1. データベースコンテナの状態確認:
   ```bash
   docker-compose ps db
   docker-compose logs db
   ```

2. 接続情報の確認:
   ```bash
   # backend環境変数の確認
   docker-compose exec backend env | grep DATABASE_URL
   ```

3. データベースの再起動:
   ```bash
   docker-compose restart db
   ```

#### 問題: マイグレーションエラー

**解決方法**:
```bash
# マイグレーションの状態確認
docker-compose exec backend alembic current

# マイグレーションのリセット（注意：データが失われます）
docker-compose down -v
docker-compose up -d
```

### パッケージ関連

#### 問題: npm/pip パッケージのバージョン競合

**Frontendの場合**:
```bash
# node_modulesとpackage-lock.jsonを削除
docker-compose exec frontend rm -rf node_modules package-lock.json
docker-compose exec frontend npm install
docker-compose restart frontend
```

**Backendの場合**:
```bash
# 仮想環境の再作成
docker-compose exec backend pip install --upgrade pip
docker-compose exec backend pip install -r requirements.txt --force-reinstall
```

### パフォーマンス関連

#### 問題: ページの読み込みが遅い

**確認項目**:
1. **リソース使用状況**:
   ```bash
   docker stats
   ```

2. **ログでエラーを確認**:
   ```bash
   docker-compose logs -f --tail=100
   ```

3. **ネットワークの確認**:
   ```bash
   docker network ls
   docker network inspect blog_blog-network
   ```

### 開発環境特有の問題

#### 問題: ホットリロードが効かない

**Frontendの場合**:
- ボリュームマウントを確認:
  ```yaml
  volumes:
    - ./frontend:/app
    - /app/node_modules  # この行が重要
  ```

**Backendの場合**:
- uvicornの--reloadオプションを確認:
  ```dockerfile
  CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
  ```

#### 問題: CORSエラー

**症状**: ブラウザコンソールに "CORS policy" エラーが表示される

**解決方法**:
1. バックエンドの環境変数を確認:
   ```bash
   docker-compose exec backend env | grep CORS_ORIGINS
   ```

2. 正しいオリジンを設定:
   ```yaml
   environment:
     - CORS_ORIGINS=http://localhost,http://localhost:3000
   ```

### 本番環境の問題

#### 問題: HTTPS接続ができない

**確認項目**:
1. SSL証明書の存在確認
2. Nginx設定の確認
3. ファイアウォールで443ポートが開いているか確認

#### 問題: アップロードした画像が表示されない

**解決方法**:
1. アップロードディレクトリの権限確認:
   ```bash
   docker-compose exec backend ls -la uploads/
   ```

2. Nginxの設定確認（uploads locationが正しいか）

### デバッグ方法

#### APIのデバッグ

1. **Swagger UIを使用**:
   http://localhost/api/docs

2. **curlでAPIテスト**:
   ```bash
   # ログインテスト
   curl -X POST http://localhost/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "admin123"}'
   ```

3. **ログの詳細確認**:
   ```bash
   docker-compose logs -f backend | grep -E "ERROR|WARNING"
   ```

#### フロントエンドのデバッグ

1. **ブラウザの開発者ツール**:
   - Networkタブでリクエストを確認
   - Consoleタブでエラーを確認

2. **React Developer Tools**の使用

### 緊急時の対応

#### 全体のリセット（最終手段）

```bash
# 警告：すべてのデータが削除されます
docker-compose down -v
docker system prune -a
rm -rf backend/__pycache__
rm -rf frontend/.next
rm -rf frontend/node_modules
docker-compose build --no-cache
docker-compose up -d
```

### ログファイルの場所

- **Backend logs**: `docker-compose logs backend`
- **Frontend logs**: `docker-compose logs frontend`
- **Nginx logs**: `docker-compose logs nginx`
- **Database logs**: `docker-compose logs db`

### サポート情報

問題が解決しない場合:
1. エラーメッセージ全文をコピー
2. 実行したコマンドの履歴
3. `docker-compose ps`の出力
4. 関連するログの最後の50行

これらの情報を用意して、イシューを作成してください。