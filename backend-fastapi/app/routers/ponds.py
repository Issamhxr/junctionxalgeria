from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..database import get_db
from ..models import Pond, Farm, FarmUser, User
from ..schemas import PondCreate, PondResponse, PondUpdate
from ..auth import get_current_active_user

router = APIRouter(prefix="/ponds", tags=["ponds"])

@router.post("/", response_model=PondResponse)
async def create_pond(
    pond: PondCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user has access to the farm
    farm_user = db.query(FarmUser).filter(
        FarmUser.farm_id == pond.farm_id,
        FarmUser.user_id == current_user.id
    ).first()
    
    if not farm_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    pond_data = pond.dict()
    pond_data["user_id"] = current_user.id
    db_pond = Pond(**pond_data)
    db.add(db_pond)
    db.commit()
    db.refresh(db_pond)
    
    return db_pond

@router.get("/", response_model=List[PondResponse])
async def read_ponds(
    skip: int = 0,
    limit: int = 100,
    farm_id: uuid.UUID = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Pond).join(FarmUser).filter(
        FarmUser.user_id == current_user.id
    )
    
    if farm_id:
        query = query.filter(Pond.farm_id == farm_id)
    
    ponds = query.offset(skip).limit(limit).all()
    return ponds

@router.get("/{pond_id}", response_model=PondResponse)
async def read_pond(
    pond_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    pond = db.query(Pond).join(FarmUser).filter(
        Pond.id == pond_id,
        FarmUser.user_id == current_user.id
    ).first()
    
    if not pond:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pond not found"
        )
    
    return pond

@router.put("/{pond_id}", response_model=PondResponse)
async def update_pond(
    pond_id: uuid.UUID,
    pond_update: PondUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    pond = db.query(Pond).join(FarmUser).filter(
        Pond.id == pond_id,
        FarmUser.user_id == current_user.id
    ).first()
    
    if not pond:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pond not found"
        )
    
    update_data = pond_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pond, field, value)
    
    db.commit()
    db.refresh(pond)
    
    return pond

@router.delete("/{pond_id}")
async def delete_pond(
    pond_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    pond = db.query(Pond).join(FarmUser).filter(
        Pond.id == pond_id,
        FarmUser.user_id == current_user.id
    ).first()
    
    if not pond:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pond not found"
        )
    
    db.delete(pond)
    db.commit()
    
    return {"message": "Pond deleted successfully"}
