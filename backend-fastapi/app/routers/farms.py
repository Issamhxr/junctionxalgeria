from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..database import get_db
from ..models import Farm, FarmUser, User
from ..schemas import FarmCreate, FarmResponse, FarmUpdate
from ..auth import get_current_active_user

router = APIRouter(prefix="/farms", tags=["farms"])

@router.post("/", response_model=FarmResponse)
async def create_farm(
    farm: FarmCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_farm = Farm(**farm.dict())
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    
    # Add current user as farm owner
    farm_user = FarmUser(
        farm_id=db_farm.id,
        user_id=current_user.id,
        role="OWNER"
    )
    db.add(farm_user)
    db.commit()
    
    return db_farm

@router.get("/", response_model=List[FarmResponse])
async def read_farms(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get farms where user is a member
    farms = db.query(Farm).join(FarmUser).filter(
        FarmUser.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return farms

@router.get("/{farm_id}", response_model=FarmResponse)
async def read_farm(
    farm_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user has access to this farm
    farm_user = db.query(FarmUser).filter(
        FarmUser.farm_id == farm_id,
        FarmUser.user_id == current_user.id
    ).first()
    
    if not farm_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
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
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user has access to this farm
    farm_user = db.query(FarmUser).filter(
        FarmUser.farm_id == farm_id,
        FarmUser.user_id == current_user.id
    ).first()
    
    if not farm_user or farm_user.role not in ["OWNER", "MANAGER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
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
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is farm owner
    farm_user = db.query(FarmUser).filter(
        FarmUser.farm_id == farm_id,
        FarmUser.user_id == current_user.id,
        FarmUser.role == "OWNER"
    ).first()
    
    if not farm_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    db.delete(farm)
    db.commit()
    
    return {"message": "Farm deleted successfully"}
