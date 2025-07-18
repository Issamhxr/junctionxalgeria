from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models import Farm, User, FarmUser
from app.schemas import FarmCreate, FarmUpdate, FarmResponse
from app.api.v1.auth import get_current_user, generate_cuid

router = APIRouter()


@router.post("/", response_model=FarmResponse)
async def create_farm(
    farm: FarmCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new farm."""
    db_farm = Farm(
        id=generate_cuid(),
        **farm.dict()
    )
    
    db.add(db_farm)
    await db.commit()
    await db.refresh(db_farm)
    
    # Add current user as farm member
    farm_user = FarmUser(
        id=generate_cuid(),
        userId=current_user.id,
        farmId=db_farm.id
    )
    
    db.add(farm_user)
    await db.commit()
    
    return db_farm


@router.get("/", response_model=List[FarmResponse])
async def get_farms(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all farms for the current user."""
    result = await db.execute(
        select(Farm)
        .join(FarmUser)
        .where(FarmUser.userId == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    farms = result.scalars().all()
    return farms


@router.get("/{farm_id}", response_model=FarmResponse)
async def get_farm(
    farm_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific farm by ID."""
    result = await db.execute(
        select(Farm)
        .join(FarmUser)
        .where(
            Farm.id == farm_id,
            FarmUser.userId == current_user.id
        )
    )
    farm = result.scalar_one_or_none()
    
    if farm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    return farm


@router.put("/{farm_id}", response_model=FarmResponse)
async def update_farm(
    farm_id: str,
    farm_update: FarmUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a farm."""
    result = await db.execute(
        select(Farm)
        .join(FarmUser)
        .where(
            Farm.id == farm_id,
            FarmUser.userId == current_user.id
        )
    )
    farm = result.scalar_one_or_none()
    
    if farm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    # Update farm attributes
    for field, value in farm_update.dict(exclude_unset=True).items():
        setattr(farm, field, value)
    
    await db.commit()
    await db.refresh(farm)
    
    return farm


@router.delete("/{farm_id}")
async def delete_farm(
    farm_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a farm."""
    result = await db.execute(
        select(Farm)
        .join(FarmUser)
        .where(
            Farm.id == farm_id,
            FarmUser.userId == current_user.id
        )
    )
    farm = result.scalar_one_or_none()
    
    if farm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    await db.delete(farm)
    await db.commit()
    
    return {"message": "Farm deleted successfully"}