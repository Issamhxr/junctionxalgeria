#!/usr/bin/env python3
"""
Simple script to create admin user using raw SQL
"""

import uuid
from sqlalchemy import create_engine, text
from app.config import settings
from passlib.context import CryptContext

def create_admin_user():
    # Database connection
    DATABASE_URL = settings.database_url
    engine = create_engine(DATABASE_URL)
    
    # Password hashing
    pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
    password_hash = pwd_context.hash('admin123')
    
    # Generate UUID for admin user
    admin_id = str(uuid.uuid4())
    
    try:
        with engine.connect() as conn:
            # Check if admin user already exists
            result = conn.execute(text("SELECT email FROM users WHERE email = 'admin@aquaculture.com'"))
            if result.fetchone():
                print("Admin user already exists!")
                print("📧 Email: admin@aquaculture.com")
                print("🔐 Password: admin123")
                return
            
            # Insert admin user
            insert_sql = text("""
                INSERT INTO users (id, email, password_hash, first_name, last_name, role, email_verified, created_at, updated_at)
                VALUES (:id, :email, :password_hash, :first_name, :last_name, :role, :email_verified, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """)
            
            conn.execute(insert_sql, {
                'id': admin_id,
                'email': 'admin@aquaculture.com',
                'password_hash': password_hash,
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'ADMIN',
                'email_verified': True
            })
            
            conn.commit()
            
            print("✅ Admin user created successfully!")
            print("📧 Email: admin@aquaculture.com")
            print("🔐 Password: admin123")
            print("👤 Role: ADMIN")
            print(f"🆔 ID: {admin_id}")
            
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")

if __name__ == "__main__":
    create_admin_user()
