from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

from ..database import get_db
from ..models import User, UserPreferences
from ..schemas import UserCreate, UserResponse, UserLogin, Token, UserPreferencesResponse
from ..auth import get_password_hash, verify_password, create_access_token, get_current_user, get_current_active_user
from ..config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        password_hash=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        role=user.role,
        status=user.status,
        language=user.language
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create default user preferences
    user_preferences = UserPreferences(
        user_id=db_user.id,
        email_notifications=True,
        sms_notifications=False,
        push_notifications=True,
        alert_frequency=30,
        language="en",
        timezone="UTC"
    )
    db.add(user_preferences)
    db.commit()
    
    return db_user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.get("/me/preferences", response_model=UserPreferencesResponse)
async def read_user_preferences(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    preferences = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    if not preferences:
        # Create default preferences if they don't exist
        preferences = UserPreferences(
            user_id=current_user.id,
            email_notifications=True,
            sms_notifications=False,
            push_notifications=True,
            alert_frequency=30,
            language="en",
            timezone="UTC"
        )
        db.add(preferences)
        db.commit()
        db.refresh(preferences)
    
    return preferences
