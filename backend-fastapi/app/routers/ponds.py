from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..database import get_db
from ..models import Pond, Farm, FarmUser, User
from ..schemas import PondCreate, PondResponse, PondUpdate
from ..auth import get_current_user

router = APIRouter(prefix="/ponds", tags=["ponds"])

@router.post("/", response_model=PondResponse)
async def create_pond(
    pond: PondCreate,
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    # For simple auth, allow all users to create ponds
    pond_data = pond.dict()
    pond_data["user_id"] = current_user.get("id", "unknown")
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
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    # For simple auth, return all ponds
    query = db.query(Pond)
    
    if farm_id:
        query = query.filter(Pond.farm_id == farm_id)
    
    ponds = query.offset(skip).limit(limit).all()
    return ponds

@router.get("/{pond_id}", response_model=PondResponse)
async def read_pond(
    pond_id: uuid.UUID,
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    pond = db.query(Pond).filter(Pond.id == pond_id).first()
    
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
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    pond = db.query(Pond).filter(Pond.id == pond_id).first()
    
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
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    pond = db.query(Pond).filter(Pond.id == pond_id).first()
    
    if not pond:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pond not found"
        )
    
    db.delete(pond)
    db.commit()
    
    return {"message": "Pond deleted successfully"}
