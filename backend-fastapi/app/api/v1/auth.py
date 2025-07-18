from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models import User
from app.schemas import UserCreate, UserResponse, Token, LoginRequest
from datetime import timedelta
from app.core.config import settings
import secrets
import string

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


def generate_cuid():
    """Generate a CUID-like ID."""
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(20))


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    from app.core.security import verify_token
    try:
        payload = verify_token(token)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    result = await db.execute(select(User).where(User.username == user.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    
    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        id=generate_cuid(),
        email=user.email,
        username=user.username,
        password=hashed_password,
        firstName=user.firstName,
        lastName=user.lastName,
        role=user.role
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return db_user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login user and return access token."""
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.isActive:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user