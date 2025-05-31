#!/bin/bash
# データベースの初期化スクリプト

echo "Waiting for database to be ready..."
sleep 10

echo "Creating database tables..."
alembic upgrade head

echo "Creating admin user..."
python create_admin.py

echo "Database initialization completed!"