"""
初期管理者ユーザーを作成するスクリプト
使用方法: python create_admin.py
"""
import sys
from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models.user import User
from app.core.security import get_password_hash

def create_admin():
    # テーブルを作成
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 既存のadminユーザーをチェック
        existing_user = db.query(User).filter(User.username == "admin").first()
        if existing_user:
            print("Admin user already exists!")
            return
        
        # 管理者ユーザーを作成
        admin_user = User(
            username="admin",
            email="admin@example.com",
            password_hash=get_password_hash("admin123")
        )
        
        db.add(admin_user)
        db.commit()
        
        print("Admin user created successfully!")
        print("Username: admin")
        print("Password: admin123")
        print("Please change the password after first login!")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()