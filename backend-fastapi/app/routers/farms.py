from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..database import get_db
from ..models import Farm, FarmUser, User
from ..schemas import FarmCreate, FarmResponse, FarmUpdate
from ..auth import get_current_user

router = APIRouter(prefix="/farms", tags=["farms"])

@router.post("/", response_model=FarmResponse)
async def create_farm(
    farm: FarmCreate,
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    db_farm = Farm(**farm.dict())
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    
    # For simple auth, skip the farm_user relationship for now
    return db_farm

@router.get("/", response_model=List[FarmResponse])
async def read_farms(
    skip: int = 0,
    limit: int = 100,
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    # For simple auth, return all farms
    farms = db.query(Farm).offset(skip).limit(limit).all()
    return farms

@router.get("/{farm_id}", response_model=FarmResponse)
async def read_farm(
    farm_id: uuid.UUID,
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    return farm

@router.put("/{farm_id}", response_model=FarmResponse)
async def update_farm(
    farm_id: uuid.UUID,
    farm_update: FarmUpdate,
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    update_data = farm_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(farm, field, value)
    
    db.commit()
    db.refresh(farm)
    
    return farm

@router.delete("/{farm_id}")
async def delete_farm(
    farm_id: uuid.UUID,
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    db.delete(farm)
    db.commit()
    
    return {"message": "Farm deleted successfully"}
