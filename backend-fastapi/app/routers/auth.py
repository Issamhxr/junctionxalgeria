from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, UserPreferences
from ..schemas import UserCreate, UserResponse, UserLogin, Token, UserPreferencesResponse
from ..auth import (
    get_password_hash, verify_password, authenticate_user, 
    create_simple_session, get_current_user, get_current_active_user,
    check_admin_role, check_technician_role, check_farmer_role, clear_session
)
from ..config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])

# Simplified login endpoint using if/else statements
@router.post("/login")
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Simple login using if/else statements for three roles:
    - ADMIN: admin@example.com, admin@aquaculture.com
    - TECHNICIAN: tech@example.com  
    - FARMER: farmer@example.com
    """
    # Use simple authentication with if/else statements
    user_data = authenticate_user(login_data.email, login_data.password)
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create simple session token (no JWT)
    session_token = create_simple_session(user_data)
    
    return {
        "access_token": session_token,
        "token_type": "session",
        "user": user_data
    }

@router.post("/logout")
async def logout(session_token: str):
    """Simple logout - clear session"""
    clear_session(session_token)
    return {"message": "Successfully logged out"}

@router.get("/me")
async def read_users_me(session_token: str = None):
    """Get current user info using simple session (no JWT)"""
    current_user = await get_current_user(session_token)
    return current_user

@router.get("/me/preferences")
async def read_user_preferences(session_token: str = None, db: Session = Depends(get_db)):
    """Get user preferences using simple session"""
    current_user = await get_current_user(session_token)
    
    # Return default preferences for simplified auth
    return {
        "user_id": current_user["id"],
        "email_notifications": True,
        "sms_notifications": False,
        "push_notifications": True,
        "alert_frequency": 30,
        "language": current_user.get("language", "en"),
        "timezone": "UTC"
    }

# Role-based endpoints using simple if/else checks
@router.get("/admin-only")
async def admin_only_endpoint(session_token: str = None):
    """Admin-only endpoint using simple role check"""
    current_user = await get_current_user(session_token)
    check_admin_role(current_user)
    return {"message": "Admin access granted", "user": current_user}

@router.get("/technician-access")
async def technician_access_endpoint(session_token: str = None):
    """Technician access endpoint (Admin + Technician roles)"""
    current_user = await get_current_user(session_token)
    check_technician_role(current_user)
    return {"message": "Technician access granted", "user": current_user}

@router.get("/farmer-access")
async def farmer_access_endpoint(session_token: str = None):
    """Farmer access endpoint (All roles)"""
    current_user = await get_current_user(session_token)
    check_farmer_role(current_user)
    return {"message": "Farmer access granted", "user": current_user}

# Commented out JWT-based registration (keeping for reference)
# @router.post("/register", response_model=UserResponse)
# async def register(user: UserCreate, db: Session = Depends(get_db)):
#     # Check if user already exists
#     db_user = db.query(User).filter(User.email == user.email).first()
#     if db_user:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Email already registered"
#         )
#     
#     # Create new user
#     hashed_password = get_password_hash(user.password)
#     db_user = User(
#         email=user.email,
#         password_hash=hashed_password,
#         first_name=user.first_name,
#         last_name=user.last_name,
#         phone=user.phone,
#         role=user.role,
#         status=user.status,
#         language=user.language
#     )
#     db.add(db_user)
#     db.commit()
#     db.refresh(db_user)
#     
#     # Create default user preferences
#     user_preferences = UserPreferences(
#         user_id=db_user.id,
#         email_notifications=True,
#         sms_notifications=False,
#         push_notifications=True,
#         alert_frequency=30,
#         language="en",
#         timezone="UTC"
#     )
#     db.add(user_preferences)
#     db.commit()
#     
#     return db_user
