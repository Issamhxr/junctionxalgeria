from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Alert, SensorData, Sensor, Pond, User
from app.schemas import AlertCreate, AlertSeverity, AlertStatus
from typing import List, Dict, Any
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class AlertService:
    """Service for managing alerts and automated alert generation."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def check_sensor_thresholds(self, pond_id: int) -> List[Alert]:
        """Check sensor data against thresholds and generate alerts."""
        alerts_created = []
        
        # Define threshold rules for different sensor types
        thresholds = {
            "temperature": {"min": 20.0, "max": 30.0, "unit": "°C"},
            "ph": {"min": 6.5, "max": 8.5, "unit": "pH"},
            "dissolved_oxygen": {"min": 5.0, "max": 15.0, "unit": "mg/L"},
            "ammonia": {"min": 0.0, "max": 0.5, "unit": "mg/L"},
            "nitrite": {"min": 0.0, "max": 0.1, "unit": "mg/L"},
            "turbidity": {"min": 0.0, "max": 10.0, "unit": "NTU"}
        }
        
        # Get recent sensor data (last 10 minutes)
        recent_time = datetime.utcnow() - timedelta(minutes=10)
        
        result = await self.db.execute(
            select(SensorData, Sensor)
            .join(Sensor)
            .where(
                SensorData.pond_id == pond_id,
                SensorData.timestamp >= recent_time
            )
        )
        
        sensor_readings = result.all()
        
        for sensor_data, sensor in sensor_readings:
            sensor_type = sensor.sensor_type.lower()
            
            if sensor_type not in thresholds:
                continue
                
            threshold = thresholds[sensor_type]
            value = sensor_data.value
            
            # Check if value is outside threshold
            alert_needed = False
            severity = AlertSeverity.MEDIUM
            
            if value < threshold["min"]:
                alert_needed = True
                severity = AlertSeverity.HIGH if value < threshold["min"] * 0.8 else AlertSeverity.MEDIUM
                message = f"{sensor_type.title()} is too low: {value}{threshold['unit']} (minimum: {threshold['min']}{threshold['unit']})"
            elif value > threshold["max"]:
                alert_needed = True
                severity = AlertSeverity.HIGH if value > threshold["max"] * 1.2 else AlertSeverity.MEDIUM
                message = f"{sensor_type.title()} is too high: {value}{threshold['unit']} (maximum: {threshold['max']}{threshold['unit']})"
            
            if alert_needed:
                # Check if similar alert already exists (avoid spam)
                existing_alert = await self.db.execute(
                    select(Alert).where(
                        Alert.pond_id == pond_id,
                        Alert.sensor_type == sensor_type,
                        Alert.status == AlertStatus.ACTIVE,
                        Alert.created_at >= datetime.utcnow() - timedelta(hours=1)
                    )
                )
                
                if not existing_alert.scalar_one_or_none():
                    # Get pond owner
                    pond_result = await self.db.execute(
                        select(Pond).where(Pond.id == pond_id)
                    )
                    pond = pond_result.scalar_one_or_none()
                    
                    if pond:
                        alert = Alert(
                            title=f"{sensor_type.title()} Alert",
                            message=message,
                            severity=severity,
                            sensor_type=sensor_type,
                            threshold_value=threshold["min"] if value < threshold["min"] else threshold["max"],
                            current_value=value,
                            user_id=pond.owner_id,
                            pond_id=pond_id
                        )
                        
                        self.db.add(alert)
                        alerts_created.append(alert)
        
        if alerts_created:
            await self.db.commit()
            logger.info(f"Created {len(alerts_created)} alerts for pond {pond_id}")
        
        return alerts_created
    
    async def get_critical_alerts(self, user_id: int) -> List[Alert]:
        """Get all critical alerts for a user."""
        result = await self.db.execute(
            select(Alert).where(
                Alert.user_id == user_id,
                Alert.severity == AlertSeverity.CRITICAL,
                Alert.status == AlertStatus.ACTIVE
            )
        )
        return result.scalars().all()
    
    async def acknowledge_alert(self, alert_id: int, user_id: int) -> Alert:
        """Acknowledge an alert."""
        result = await self.db.execute(
            select(Alert).where(
                Alert.id == alert_id,
                Alert.user_id == user_id
            )
        )
        alert = result.scalar_one_or_none()
        
        if alert:
            alert.status = AlertStatus.ACKNOWLEDGED
            await self.db.commit()
            await self.db.refresh(alert)
        
        return alert
    
    async def resolve_alert(self, alert_id: int, user_id: int) -> Alert:
        """Resolve an alert."""
        result = await self.db.execute(
            select(Alert).where(
                Alert.id == alert_id,
                Alert.user_id == user_id
            )
        )
        alert = result.scalar_one_or_none()
        
        if alert:
            alert.status = AlertStatus.RESOLVED
            await self.db.commit()
            await self.db.refresh(alert)
        
        return alert