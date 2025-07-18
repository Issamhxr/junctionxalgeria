from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models import SensorData, Pond, User, SensorType
from app.schemas import SensorDataCreate, SensorDataResponse, SensorDataStats
from app.api.v1.auth import get_current_user, generate_cuid

router = APIRouter()


@router.post("/", response_model=SensorDataResponse)
async def create_sensor_data(
    sensor_data: SensorDataCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new sensor data entry."""
    # Verify pond belongs to current user
    result = await db.execute(
        select(Pond).where(
            Pond.id == sensor_data.pondId,
            Pond.userId == current_user.id
        )
    )
    pond = result.scalar_one_or_none()
    
    if pond is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pond not found"
        )
    
    db_sensor_data = SensorData(
        id=generate_cuid(),
        **sensor_data.dict(),
        userId=current_user.id
    )
    
    db.add(db_sensor_data)
    await db.commit()
    await db.refresh(db_sensor_data)
    
    return db_sensor_data


@router.get("/", response_model=List[SensorDataResponse])
async def get_sensor_data(
    pond_id: Optional[str] = None,
    sensor_type: Optional[SensorType] = None,
    hours: Optional[int] = 24,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get sensor data with optional filtering."""
    query = select(SensorData).join(Pond).where(Pond.userId == current_user.id)
    
    if pond_id:
        query = query.where(SensorData.pondId == pond_id)
    
    if sensor_type:
        query = query.where(SensorData.sensorType == sensor_type)
    
    if hours:
        since = datetime.utcnow() - timedelta(hours=hours)
        query = query.where(SensorData.timestamp >= since)
    
    query = query.order_by(desc(SensorData.timestamp))
    result = await db.execute(query.offset(skip).limit(limit))
    sensor_data = result.scalars().all()
    
    return sensor_data


@router.get("/stats/{pond_id}", response_model=List[SensorDataStats])
async def get_sensor_stats(
    pond_id: str,
    hours: int = 24,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get sensor statistics for a pond."""
    # Verify pond belongs to current user
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
    
    since = datetime.utcnow() - timedelta(hours=hours)
    
    # Get stats grouped by sensor type
    result = await db.execute(
        select(
            SensorData.sensorType,
            func.min(SensorData.value).label('min_value'),
            func.max(SensorData.value).label('max_value'),
            func.avg(SensorData.value).label('avg_value'),
            SensorData.unit,
            SensorData.quality
        )
        .where(
            SensorData.pondId == pond_id,
            SensorData.timestamp >= since
        )
        .group_by(SensorData.sensorType, SensorData.unit, SensorData.quality)
    )
    
    stats = []
    for row in result:
        # Get latest value for this sensor type
        latest_result = await db.execute(
            select(SensorData.value)
            .where(
                SensorData.pondId == pond_id,
                SensorData.sensorType == row.sensorType
            )
            .order_by(desc(SensorData.timestamp))
            .limit(1)
        )
        latest_value = latest_result.scalar_one_or_none() or 0
        
        stats.append(SensorDataStats(
            sensorType=row.sensorType,
            currentValue=latest_value,
            minValue=row.min_value,
            maxValue=row.max_value,
            avgValue=row.avg_value,
            unit=row.unit,
            quality=row.quality
        ))
    
    return stats


@router.delete("/{data_id}")
async def delete_sensor_data(
    data_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete sensor data entry."""
    result = await db.execute(
        select(SensorData).join(Pond).where(
            SensorData.id == data_id,
            Pond.userId == current_user.id
        )
    )
    sensor_data = result.scalar_one_or_none()
    
    if sensor_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sensor data not found"
        )
    
    await db.delete(sensor_data)
    await db.commit()
    
    return {"message": "Sensor data deleted successfully"}