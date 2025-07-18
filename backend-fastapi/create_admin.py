#!/usr/bin/env python3
"""
Script to create admin user in the database
"""

import asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models import User, UserRole
from passlib.context import CryptContext

async def create_admin_user():
    # Database connection
    DATABASE_URL = settings.database_url
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Password hashing
    pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
    password_hash = pwd_context.hash('admin123')
    
    # Create session
    db = SessionLocal()
    
    try:
        # Check if admin user already exists
        existing_user = db.query(User).filter(User.email == 'admin@aquaculture.com').first()
        
        if existing_user:
            print("Admin user already exists!")
            print(f"Email: {existing_user.email}")
            print(f"Role: {existing_user.role}")
            return
        
        # Create admin user
        admin_user = User(
            email='admin@aquaculture.com',
            password_hash=password_hash,
            first_name='Admin',
            last_name='User',
            role=UserRole.ADMIN,
            email_verified=True
        )
        
        db.add(admin_user)
        db.commit()
        
        print("✅ Admin user created successfully!")
        print("📧 Email: admin@aquaculture.com")
        print("🔐 Password: admin123")
        print(f"👤 Role: {admin_user.role}")
        print(f"🆔 ID: {admin_user.id}")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(create_admin_user())
