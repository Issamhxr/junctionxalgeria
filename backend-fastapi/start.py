#!/usr/bin/env python3
"""
Startup script for the FastAPI Aquaculture Management System
"""
import asyncio
import sys
import os
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.core.config import settings
from app.core.database import init_db
from app.core.security import get_password_hash
from app.models import User, UserRole
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.api.v1.auth import generate_cuid


async def create_admin_user():
    """Create a default admin user if it doesn't exist."""
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        
        # Check if admin user exists
        result = await session.execute(
            select(User).where(User.username == "admin")
        )
        admin_user = result.scalar_one_or_none()
        
        if not admin_user:
            # Create admin user
            admin_user = User(
                id=generate_cuid(),
                username="admin",
                email="admin@aquaculture.com",
                password=get_password_hash("admin123"),
                firstName="System",
                lastName="Administrator",
                role=UserRole.ADMIN,
                isActive=True
            )
            session.add(admin_user)
            await session.commit()
            print("✅ Admin user created successfully!")
            print("   Username: admin")
            print("   Password: admin123")
            print("   Email: admin@aquaculture.com")
        else:
            print("✅ Admin user already exists")


async def main():
    """Main startup function."""
    print("🚀 Starting FastAPI Aquaculture Management System...")
    print(f"📊 Database URL: {settings.DATABASE_URL}")
    print(f"🌐 Server will run on: {settings.HOST}:{settings.PORT}")
    
    try:
        # Initialize database
        print("🔧 Initializing database...")
        await init_db()
        print("✅ Database initialized successfully!")
        
        # Create admin user
        print("👤 Setting up admin user...")
        await create_admin_user()
        
        # Start the server
        print("\n🎉 Setup complete! Starting server...")
        print(f"📝 API Documentation: http://{settings.HOST}:{settings.PORT}/docs")
        print(f"🔄 Alternative docs: http://{settings.HOST}:{settings.PORT}/redoc")
        
        # Import and run uvicorn
        import uvicorn
        uvicorn.run(
            "main:app",
            host=settings.HOST,
            port=settings.PORT,
            reload=settings.DEBUG,
            log_level="info"
        )
        
    except Exception as e:
        print(f"❌ Error during startup: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())