from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models import Pond, User, Farm
from app.schemas import PondCreate, PondUpdate, PondResponse
from app.api.v1.auth import get_current_user, generate_cuid

router = APIRouter()


@router.post("/", response_model=PondResponse)
async def create_pond(
    pond: PondCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new pond."""
    # Verify farm exists and user has access
    result = await db.execute(
        select(Farm).where(Farm.id == pond.farmId)
    )
    farm = result.scalar_one_or_none()
    
    if farm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    db_pond = Pond(
        id=generate_cuid(),
        **pond.dict(),
        userId=current_user.id
    )
    
    db.add(db_pond)
    await db.commit()
    await db.refresh(db_pond)
    
    return db_pond


@router.get("/", response_model=List[PondResponse])
async def get_ponds(
    farm_id: str = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all ponds for the current user."""
    query = select(Pond).where(Pond.userId == current_user.id)
    
    if farm_id:
        query = query.where(Pond.farmId == farm_id)
    
    result = await db.execute(query.offset(skip).limit(limit))
    ponds = result.scalars().all()
    return ponds


@router.get("/{pond_id}", response_model=PondResponse)
async def get_pond(
    pond_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific pond by ID."""
    result = await db.execute(
        select(Pond).where(
            Pond.id == pond_id,
            Pond.userId == current_user.id
        )
    )
    pond = result.scalar_one_or_none()
    
    if pond is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pond not found"
        )
    
    return pond


@router.put("/{pond_id}", response_model=PondResponse)
async def update_pond(
    pond_id: str,
    pond_update: PondUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a pond."""
    result = await db.execute(
        select(Pond).where(
            Pond.id == pond_id,
            Pond.userId == current_user.id
        )
    )
    pond = result.scalar_one_or_none()
    
    if pond is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pond not found"
        )
    
    # Update pond attributes
    for field, value in pond_update.dict(exclude_unset=True).items():
        setattr(pond, field, value)
    
    await db.commit()
    await db.refresh(pond)
    
    return pond


@router.delete("/{pond_id}")
async def delete_pond(
    pond_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a pond."""
    result = await db.execute(
        select(Pond).where(
            Pond.id == pond_id,
            Pond.userId == current_user.id
        )
    )
    pond = result.scalar_one_or_none()
    
    if pond is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pond not found"
        )
    
    await db.delete(pond)
    await db.commit()
    
    return {"message": "Pond deleted successfully"}