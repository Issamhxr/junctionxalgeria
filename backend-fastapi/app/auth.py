from passlib.context import CryptContext
from typing import Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from .database import get_db
from .models import User
from .config import settings

# Comment out JWT-related imports and logic
# from jose import JWTError, jwt
# from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Simple hardcoded users for testing - using if/else authentication
SIMPLE_USERS = [
    {
        "id": "6d8a9b4c-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        "email": "admin@example.com",
        "password": "admin123",
        "first_name": "Admin",
        "last_name": "User",
        "phone": None,
        "role": "ADMIN",
        "status": "ACTIVE",
        "language": "en",
        "last_login": None
    },
    {
        "id": "855b7c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d",
        "email": "admin@aquaculture.com",
        "password": "admin123",
        "first_name": "Admin",
        "last_name": "User",
        "phone": None,
        "role": "ADMIN",
        "status": "ACTIVE",
        "language": "en",
        "last_login": None
    },
    {
        "id": "b73c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e",
        "email": "tech@example.com",
        "password": "tech123",
        "first_name": "Jane",
        "last_name": "Technician",
        "phone": None,
        "role": "TECHNICIAN",
        "status": "ACTIVE",
        "language": "en",
        "last_login": None
    },
    {
        "id": "c68d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
        "email": "farmer@example.com",
        "password": "farmer123",
        "first_name": "John",
        "last_name": "Farmer",
        "phone": None,
        "role": "FARMER",
        "status": "ACTIVE",
        "language": "en",
        "last_login": None
    }
]

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Simple authentication function using if/else statements for three roles
def authenticate_user(email: str, password: str):
    """Simple authentication using hardcoded users with if/else statements"""
    # ADMIN role users
    if email == "admin@example.com" and password == "admin123":
        return SIMPLE_USERS[0]  # Admin user 1
    elif email == "admin@aquaculture.com" and password == "admin123":
        return SIMPLE_USERS[1]  # Admin user 2
    
    # TECHNICIAN role users
    elif email == "tech@example.com" and password == "tech123":
        return SIMPLE_USERS[2]  # Technician user
    
    # FARMER role users
    elif email == "farmer@example.com" and password == "farmer123":
        return SIMPLE_USERS[3]  # Farmer user
    
    # Invalid credentials
    else:
        return None

# Simple session storage (in-memory for testing)
active_sessions = {}

def create_simple_session(user_data: dict):
    """Create a simple session token based on user email"""
    session_token = f"session_{user_data['email'].replace('@', '_').replace('.', '_')}"
    active_sessions[session_token] = user_data
    return session_token

def get_user_from_session(session_token: str):
    """Get user data from session token"""
    return active_sessions.get(session_token)

def clear_session(session_token: str):
    """Clear user session"""
    if session_token in active_sessions:
        del active_sessions[session_token]

# Simple session-based user functions (no JWT)
async def get_current_user(session_token: str = None):
    """Get current user from session token - no JWT required"""
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token required"
        )
    
    user_data = get_user_from_session(session_token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session token"
        )
    
    return user_data

async def get_current_active_user(user_data: dict = Depends(get_current_user)):
    """Get current active user"""
    if user_data.get("status") != "ACTIVE":
        raise HTTPException(status_code=400, detail="Inactive user")
    return user_data

# Role-based access control using simple if/else statements
def check_admin_role(user_data: dict):
    """Check if user has ADMIN role"""
    if user_data.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return True

def check_technician_role(user_data: dict):
    """Check if user has TECHNICIAN role"""
    if user_data.get("role") not in ["ADMIN", "TECHNICIAN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Technician access required"
        )
    return True

def check_farmer_role(user_data: dict):
    """Check if user has FARMER role"""
    if user_data.get("role") not in ["ADMIN", "TECHNICIAN", "FARMER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Farmer access required"
        )
    return True

# Commented out JWT-related functions
# def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
#     """Create JWT access token"""
#     to_encode = data.copy()
#     if expires_delta:
#         expire = datetime.utcnow() + expires_delta
#     else:
#         expire = datetime.utcnow() + timedelta(minutes=15)
#     to_encode.update({"exp": expire})
#     encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
#     return encoded_jwt

# def verify_token(token: str):
#     """Verify JWT token"""
#     try:
#         payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
#         email: str = payload.get("sub")
#         if email is None:
#             raise HTTPException(status_code=401, detail="Could not validate credentials")
#         return email
#     except JWTError:
#         raise HTTPException(status_code=401, detail="Could not validate credentials")
