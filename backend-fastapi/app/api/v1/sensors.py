from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models import Sensor, Pond, User
from app.schemas import SensorCreate, SensorUpdate, SensorResponse
from app.api.v1.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=SensorResponse)
async def create_sensor(
    sensor: SensorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new sensor."""
    # Verify pond belongs to current user
    result = await db.execute(
        select(Pond).where(
            Pond.id == sensor.pond_id,
            Pond.owner_id == current_user.id
        )
    )
    pond = result.scalar_one_or_none()
    
    if pond is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pond not found"
        )
    
    # Check if device_id is unique
    result = await db.execute(
        select(Sensor).where(Sensor.device_id == sensor.device_id)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Device ID already exists"
        )
    
    db_sensor = Sensor(**sensor.dict())
    db.add(db_sensor)
    await db.commit()
    await db.refresh(db_sensor)
    
    return db_sensor


@router.get("/", response_model=List[SensorResponse])
async def get_sensors(
    pond_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all sensors for the current user."""
    query = select(Sensor).join(Pond).where(Pond.owner_id == current_user.id)
    
    if pond_id:
        query = query.where(Sensor.pond_id == pond_id)
    
    result = await db.execute(query.offset(skip).limit(limit))
    sensors = result.scalars().all()
    return sensors


@router.get("/{sensor_id}", response_model=SensorResponse)
async def get_sensor(
    sensor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific sensor by ID."""
    result = await db.execute(
        select(Sensor).join(Pond).where(
            Sensor.id == sensor_id,
            Pond.owner_id == current_user.id
        )
    )
    sensor = result.scalar_one_or_none()
    
    if sensor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sensor not found"
        )
    
    return sensor


@router.put("/{sensor_id}", response_model=SensorResponse)
async def update_sensor(
    sensor_id: int,
    sensor_update: SensorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a sensor."""
    result = await db.execute(
        select(Sensor).join(Pond).where(
            Sensor.id == sensor_id,
            Pond.owner_id == current_user.id
        )
    )
    sensor = result.scalar_one_or_none()
    
    if sensor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sensor not found"
        )
    
    # Update sensor attributes
    for field, value in sensor_update.dict(exclude_unset=True).items():
        setattr(sensor, field, value)
    
    await db.commit()
    await db.refresh(sensor)
    
    return sensor


@router.delete("/{sensor_id}")
async def delete_sensor(
    sensor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a sensor."""
    result = await db.execute(
        select(Sensor).join(Pond).where(
            Sensor.id == sensor_id,
            Pond.owner_id == current_user.id
        )
    )
    sensor = result.scalar_one_or_none()
    
    if sensor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sensor not found"
        )
    
    await db.delete(sensor)
    await db.commit()
    
    return {"message": "Sensor deleted successfully"}