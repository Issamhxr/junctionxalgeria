from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..database import get_db
from ..models import Alert, Pond, FarmUser, User
from ..schemas import AlertCreate, AlertResponse, AlertUpdate
from ..auth import get_current_user
from ..services.notifications import notification_service

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.post("/", response_model=AlertResponse)
async def create_alert(
    alert: AlertCreate,
    background_tasks: BackgroundTasks,
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    # For simple auth, allow all users to create alerts
    alert_data = alert.dict()
    alert_data["user_id"] = current_user.get("id", "unknown")
    db_alert = Alert(**alert_data)
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    
    # Get users who should receive notifications for this alert
    # This would typically be based on farm membership, roles, etc.
    users_to_notify = db.query(User).filter(
        User.id.in_(
            db.query(FarmUser.user_id).filter(
                FarmUser.farm_id == alert.farm_id
            )
        )
    ).all()
    
    # Send notifications in the background
    if users_to_notify:
        background_tasks.add_task(
            notification_service.send_alert_notification,
            db_alert,
            users_to_notify,
            db
        )
    
    return db_alert

@router.get("/", response_model=List[AlertResponse])
async def read_alerts(
    skip: int = 0,
    limit: int = 100,
    pond_id: uuid.UUID = None,
    severity: str = None,
    is_resolved: bool = None,
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    # For simple auth, return all alerts
    query = db.query(Alert)
    
    if pond_id:
        query = query.filter(Alert.pond_id == pond_id)
    
    if severity:
        query = query.filter(Alert.severity == severity)
    
    if is_resolved is not None:
        query = query.filter(Alert.is_resolved == is_resolved)
    
    alerts = query.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()
    return alerts

@router.get("/{alert_id}", response_model=AlertResponse)
async def read_alert(
    alert_id: uuid.UUID,
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    return alert

@router.put("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: uuid.UUID,
    alert_update: AlertUpdate,
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    update_data = alert_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(alert, field, value)
    
    if update_data.get("is_resolved"):
        alert.resolved_by = current_user.get("id", "unknown")
    
    db.commit()
    db.refresh(alert)
    
    return alert

@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: uuid.UUID,
    session_token: str = None,
    db: Session = Depends(get_db)
):
    current_user = await get_current_user(session_token)
    
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    db.delete(alert)
    db.commit()
    
    return {"message": "Alert deleted successfully"}
