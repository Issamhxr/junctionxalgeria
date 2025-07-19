from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..database import get_db
from ..models import SensorData, Pond, FarmUser, User
from ..schemas import SensorDataCreate, SensorDataResponse
from ..auth import get_current_user

router = APIRouter(prefix="/sensor-data", tags=["sensor-data"])

@router.post("/", response_model=SensorDataResponse)
async def create_sensor_data(
    sensor_data: SensorDataCreate,
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    # For simple auth, allow all users to create sensor data
    sensor_data_dict = sensor_data.dict()
    sensor_data_dict["user_id"] = current_user.get("id", "unknown")
    db_sensor_data = SensorData(**sensor_data_dict)
    db.add(db_sensor_data)
    db.commit()
    db.refresh(db_sensor_data)
    
    return db_sensor_data

@router.get("/", response_model=List[SensorDataResponse])
async def read_sensor_data(
    skip: int = 0,
    limit: int = 100,
    pond_id: uuid.UUID = None,
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    # For simple auth, return all sensor data
    query = db.query(SensorData)
    
    if pond_id:
        query = query.filter(SensorData.pond_id == pond_id)
    
    sensor_data = query.order_by(SensorData.timestamp.desc()).offset(skip).limit(limit).all()
    return sensor_data

@router.get("/{sensor_data_id}", response_model=SensorDataResponse)
async def read_sensor_data_by_id(
    sensor_data_id: uuid.UUID,
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    sensor_data = db.query(SensorData).filter(SensorData.id == sensor_data_id).first()
    
    if not sensor_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sensor data not found"
        )
    
    return sensor_data

@router.get("/pond/{pond_id}/latest", response_model=SensorDataResponse)
async def get_latest_sensor_data(
    pond_id: uuid.UUID,
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    # For simple auth, allow access to all ponds
    latest_data = db.query(SensorData).filter(
        SensorData.pond_id == pond_id
    ).order_by(SensorData.timestamp.desc()).first()
    
    if not latest_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sensor data found for this pond"
        )
    
    return latest_data
