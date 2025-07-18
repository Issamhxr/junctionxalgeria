from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.core.database import get_db
from app.models import Alert, Pond, User, Farm, SensorData, AlertSeverity
from app.schemas import AlertCreate, AlertUpdate, AlertResponse, DashboardStats, UserActivityResponse
from app.api.v1.auth import get_current_user, generate_cuid

router = APIRouter()


@router.post("/", response_model=AlertResponse)
async def create_alert(
    alert: AlertCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new alert."""
    # Verify pond belongs to current user
    result = await db.execute(
        select(Pond).where(
            Pond.id == alert.pondId,
            Pond.userId == current_user.id
        )
    )
    pond = result.scalar_one_or_none()
    
    if pond is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pond not found"
        )
    
    db_alert = Alert(
        id=generate_cuid(),
        **alert.dict(),
        userId=current_user.id
    )
    
    db.add(db_alert)
    await db.commit()
    await db.refresh(db_alert)
    
    return db_alert


@router.get("/", response_model=List[AlertResponse])
async def get_alerts(
    pond_id: Optional[str] = None,
    severity: Optional[AlertSeverity] = None,
    is_read: Optional[bool] = None,
    is_resolved: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all alerts for the current user."""
    query = select(Alert).where(Alert.userId == current_user.id)
    
    if pond_id:
        query = query.where(Alert.pondId == pond_id)
    
    if severity:
        query = query.where(Alert.severity == severity)
    
    if is_read is not None:
        query = query.where(Alert.isRead == is_read)
    
    if is_resolved is not None:
        query = query.where(Alert.isResolved == is_resolved)
    
    result = await db.execute(query.offset(skip).limit(limit))
    alerts = result.scalars().all()
    return alerts


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific alert by ID."""
    result = await db.execute(
        select(Alert).where(
            Alert.id == alert_id,
            Alert.userId == current_user.id
        )
    )
    alert = result.scalar_one_or_none()
    
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    return alert


@router.put("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: str,
    alert_update: AlertUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an alert."""
    result = await db.execute(
        select(Alert).where(
            Alert.id == alert_id,
            Alert.userId == current_user.id
        )
    )
    alert = result.scalar_one_or_none()
    
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    # Update alert attributes
    for field, value in alert_update.dict(exclude_unset=True).items():
        setattr(alert, field, value)
    
    await db.commit()
    await db.refresh(alert)
    
    return alert


@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an alert."""
    result = await db.execute(
        select(Alert).where(
            Alert.id == alert_id,
            Alert.userId == current_user.id
        )
    )
    alert = result.scalar_one_or_none()
    
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    await db.delete(alert)
    await db.commit()
    
    return {"message": "Alert deleted successfully"}


@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics for the current user."""
    # Total ponds
    total_ponds_result = await db.execute(
        select(func.count(Pond.id)).where(Pond.userId == current_user.id)
    )
    total_ponds = total_ponds_result.scalar()
    
    # Active ponds
    active_ponds_result = await db.execute(
        select(func.count(Pond.id)).where(
            Pond.userId == current_user.id,
            Pond.status == "ACTIVE"
        )
    )
    active_ponds = active_ponds_result.scalar()
    
    # Total farms
    total_farms_result = await db.execute(
        select(func.count(func.distinct(Pond.farmId))).where(Pond.userId == current_user.id)
    )
    total_farms = total_farms_result.scalar()
    
    # Total sensor data points
    total_sensors_result = await db.execute(
        select(func.count(SensorData.id)).where(SensorData.userId == current_user.id)
    )
    total_sensors = total_sensors_result.scalar()
    
    # Active alerts
    active_alerts_result = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.userId == current_user.id,
            Alert.isResolved == False
        )
    )
    active_alerts = active_alerts_result.scalar()
    
    # Critical alerts
    critical_alerts_result = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.userId == current_user.id,
            Alert.severity == AlertSeverity.CRITICAL,
            Alert.isResolved == False
        )
    )
    critical_alerts = critical_alerts_result.scalar()
    
    # Recent activities (placeholder - would need UserActivity model)
    recent_activities = []
    
    return DashboardStats(
        totalPonds=total_ponds,
        activePonds=active_ponds,
        totalSensors=total_sensors,
        totalFarms=total_farms,
        activeAlerts=active_alerts,
        criticalAlerts=critical_alerts,
        recentActivities=recent_activities
    )