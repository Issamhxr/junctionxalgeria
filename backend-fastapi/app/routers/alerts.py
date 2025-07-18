from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..database import get_db
from ..models import Alert, Pond, FarmUser, User
from ..schemas import AlertCreate, AlertResponse, AlertUpdate
from ..auth import get_current_active_user

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.post("/", response_model=AlertResponse)
async def create_alert(
    alert: AlertCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user has access to the pond
    pond = db.query(Pond).join(FarmUser).filter(
        Pond.id == alert.pond_id,
        FarmUser.user_id == current_user.id
    ).first()
    
    if not pond:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    alert_data = alert.dict()
    alert_data["user_id"] = current_user.id
    db_alert = Alert(**alert_data)
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    
    return db_alert

@router.get("/", response_model=List[AlertResponse])
async def read_alerts(
    skip: int = 0,
    limit: int = 100,
    pond_id: uuid.UUID = None,
    severity: str = None,
    is_resolved: bool = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Alert).join(Pond).join(FarmUser).filter(
        FarmUser.user_id == current_user.id
    )
    
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
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).join(Pond).join(FarmUser).filter(
        Alert.id == alert_id,
        FarmUser.user_id == current_user.id
    ).first()
    
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
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).join(Pond).join(FarmUser).filter(
        Alert.id == alert_id,
        FarmUser.user_id == current_user.id
    ).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    update_data = alert_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(alert, field, value)
    
    if update_data.get("is_resolved"):
        alert.resolved_by = current_user.id
    
    db.commit()
    db.refresh(alert)
    
    return alert

@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).join(Pond).join(FarmUser).filter(
        Alert.id == alert_id,
        FarmUser.user_id == current_user.id
    ).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    db.delete(alert)
    db.commit()
    
    return {"message": "Alert deleted successfully"}
