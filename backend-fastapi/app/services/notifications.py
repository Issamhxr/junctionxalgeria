import os
import json
from datetime import datetime
from typing import List, Dict, Optional, Any
from twilio.rest import Client
from twilio.base.exceptions import TwilioException
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from ..config import settings
from ..models import User, Alert, AlertSeverity
from sqlalchemy.orm import Session
import asyncio
import aiohttp
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        # Twilio configuration
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_phone_number = os.getenv("TWILIO_PHONE_NUMBER")
        
        # Email configuration
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        
        # Push notification configuration
        self.vapid_public_key = os.getenv("VAPID_PUBLIC_KEY")
        self.vapid_private_key = os.getenv("VAPID_PRIVATE_KEY")
        self.vapid_email = os.getenv("VAPID_EMAIL")
        
        # WhatsApp Business API configuration
        self.whatsapp_access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
        self.whatsapp_phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        
        # Initialize Twilio client
        if self.twilio_account_sid and self.twilio_auth_token:
            self.twilio_client = Client(self.twilio_account_sid, self.twilio_auth_token)
        else:
            self.twilio_client = None
            logger.warning("Twilio credentials not configured")

    async def send_alert_notification(self, alert: Alert, users: List[User], db: Session):
        """
        Send notifications for an alert through multiple channels
        """
        notification_tasks = []
        
        for user in users:
            # Get user notification preferences
            user_preferences = await self.get_user_notification_preferences(user.id, db)
            
            # Create notification message
            message = self.create_alert_message(alert)
            
            # Send notifications based on user preferences and alert severity
            if self.should_send_notification(alert, user_preferences):
                # SMS notification
                if user_preferences.get("sms_enabled", False) and user.phone:
                    notification_tasks.append(
                        self.send_sms_notification(user.phone, message, alert.severity)
                    )
                
                # Email notification
                if user_preferences.get("email_enabled", False) and user.email:
                    notification_tasks.append(
                        self.send_email_notification(user.email, message, alert)
                    )
                
                # Push notification
                if user_preferences.get("push_enabled", False):
                    notification_tasks.append(
                        self.send_push_notification(user.id, message, alert, db)
                    )
                
                # WhatsApp notification (for critical alerts)
                if (alert.severity == AlertSeverity.CRITICAL and 
                    user_preferences.get("whatsapp_enabled", False) and 
                    user.phone):
                    notification_tasks.append(
                        self.send_whatsapp_notification(user.phone, message, alert)
                    )
        
        # Execute all notifications concurrently
        if notification_tasks:
            await asyncio.gather(*notification_tasks, return_exceptions=True)

    def should_send_notification(self, alert: Alert, user_preferences: Dict) -> bool:
        """
        Determine if notification should be sent based on user preferences and alert severity
        """
        # Always send critical alerts
        if alert.severity == AlertSeverity.CRITICAL:
            return True
            
        # Check user's minimum severity threshold
        min_severity = user_preferences.get("min_severity", "LOW")
        severity_hierarchy = {
            "LOW": 0,
            "MEDIUM": 1,
            "HIGH": 2,
            "CRITICAL": 3
        }
        
        alert_severity_value = severity_hierarchy.get(alert.severity.value, 0)
        min_severity_value = severity_hierarchy.get(min_severity, 0)
        
        return alert_severity_value >= min_severity_value

    def create_alert_message(self, alert: Alert) -> Dict[str, str]:
        """
        Create alert message for different notification channels
        """
        severity_emojis = {
            AlertSeverity.LOW: "ℹ️",
            AlertSeverity.MEDIUM: "⚠️",
            AlertSeverity.HIGH: "🔥",
            AlertSeverity.CRITICAL: "🚨"
        }
        
        emoji = severity_emojis.get(alert.severity, "📢")
        
        return {
            "title": f"{emoji} Alerte {alert.severity.value}",
            "body": alert.message,
            "short": f"{emoji} {alert.title}",
            "detailed": f"{emoji} {alert.title}\n\n{alert.message}\n\nBassin: {alert.pond.name}\nFerme: {alert.farm.name}\nHeure: {alert.created_at.strftime('%H:%M')}"
        }

    async def send_sms_notification(self, phone_number: str, message: Dict[str, str], severity: AlertSeverity):
        """
        Send SMS notification via Twilio
        """
        if not self.twilio_client:
            logger.warning("Twilio client not initialized")
            return
            
        try:
            # Format phone number (ensure it starts with + and country code)
            if not phone_number.startswith('+'):
                phone_number = '+213' + phone_number.lstrip('0')  # Algeria country code
            
            # Create SMS message
            sms_message = f"{message['title']}\n{message['body']}"
            
            # Send SMS
            message_instance = self.twilio_client.messages.create(
                body=sms_message,
                from_=self.twilio_phone_number,
                to=phone_number
            )
            
            logger.info(f"SMS sent successfully to {phone_number}: {message_instance.sid}")
            
        except TwilioException as e:
            logger.error(f"Twilio error sending SMS to {phone_number}: {e}")
        except Exception as e:
            logger.error(f"Error sending SMS to {phone_number}: {e}")

    async def send_email_notification(self, email: str, message: Dict[str, str], alert: Alert):
        """
        Send email notification
        """
        if not self.smtp_username or not self.smtp_password:
            logger.warning("SMTP credentials not configured")
            return
            
        try:
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = self.smtp_username
            msg['To'] = email
            msg['Subject'] = message['title']
            
            # Create HTML body
            html_body = f"""
            <html>
                <body>
                    <h2>{message['title']}</h2>
                    <p><strong>{message['body']}</strong></p>
                    <hr>
                    <p><strong>Détails:</strong></p>
                    <ul>
                        <li><strong>Bassin:</strong> {alert.pond.name}</li>
                        <li><strong>Ferme:</strong> {alert.farm.name}</li>
                        <li><strong>Sévérité:</strong> {alert.severity.value}</li>
                        <li><strong>Paramètre:</strong> {alert.parameter or 'N/A'}</li>
                        <li><strong>Valeur actuelle:</strong> {alert.current_value or 'N/A'}</li>
                        <li><strong>Seuil:</strong> {alert.threshold_value or 'N/A'}</li>
                        <li><strong>Heure:</strong> {alert.created_at.strftime('%d/%m/%Y à %H:%M')}</li>
                    </ul>
                    <p><a href="{settings.FRONTEND_URL}/alerts/{alert.id}">Voir l'alerte</a></p>
                </body>
            </html>
            """
            
            msg.attach(MIMEText(html_body, 'html'))
            
            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email sent successfully to {email}")
            
        except Exception as e:
            logger.error(f"Error sending email to {email}: {e}")

    async def send_push_notification(self, user_id: str, message: Dict[str, str], alert: Alert, db: Session):
        """
        Send push notification to user's registered devices
        """
        try:
            # Get user's push subscriptions from database
            push_subscriptions = await self.get_user_push_subscriptions(user_id, db)
            
            if not push_subscriptions:
                logger.info(f"No push subscriptions found for user {user_id}")
                return
            
            # Create push notification payload
            notification_payload = {
                "title": message['title'],
                "body": message['body'],
                "icon": "/icons/alert-icon.png",
                "badge": "/icons/badge.png",
                "tag": f"alert-{alert.id}",
                "data": {
                    "alertId": str(alert.id),
                    "farmId": str(alert.farm_id),
                    "pondId": str(alert.pond_id),
                    "severity": alert.severity.value,
                    "url": f"/alerts/{alert.id}",
                    "timestamp": alert.created_at.isoformat()
                },
                "actions": [
                    {
                        "action": "view",
                        "title": "Voir l'alerte",
                        "icon": "/icons/view.png"
                    },
                    {
                        "action": "dismiss",
                        "title": "Ignorer",
                        "icon": "/icons/close.png"
                    }
                ],
                "requireInteraction": alert.severity == AlertSeverity.CRITICAL,
                "silent": False
            }
            
            # Send to all user devices
            for subscription in push_subscriptions:
                await self.send_web_push(subscription, notification_payload)
                
        except Exception as e:
            logger.error(f"Error sending push notification to user {user_id}: {e}")

    async def send_web_push(self, subscription: Dict, payload: Dict):
        """
        Send web push notification using pywebpush or direct HTTP call
        """
        try:
            # For now, we'll use a direct HTTP call to the push service
            # In production, you should use the pywebpush library
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.vapid_private_key}",
                "TTL": "86400"  # 24 hours
            }
            
            data = {
                "notification": payload
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    subscription["endpoint"],
                    headers=headers,
                    json=data
                ) as response:
                    if response.status == 200:
                        logger.info("Push notification sent successfully")
                    else:
                        logger.error(f"Push notification failed: {response.status}")
                        
        except Exception as e:
            logger.error(f"Error sending web push: {e}")

    async def send_whatsapp_notification(self, phone_number: str, message: Dict[str, str], alert: Alert):
        """
        Send WhatsApp notification via WhatsApp Business API
        """
        if not self.whatsapp_access_token:
            logger.warning("WhatsApp access token not configured")
            return
            
        try:
            # Format phone number for WhatsApp
            if not phone_number.startswith('+'):
                phone_number = '+213' + phone_number.lstrip('0')
            
            # WhatsApp Business API endpoint
            url = f"https://graph.facebook.com/v18.0/{self.whatsapp_phone_number_id}/messages"
            
            headers = {
                "Authorization": f"Bearer {self.whatsapp_access_token}",
                "Content-Type": "application/json"
            }
            
            # Create WhatsApp message
            whatsapp_message = {
                "messaging_product": "whatsapp",
                "to": phone_number.replace('+', ''),
                "type": "text",
                "text": {
                    "body": message['detailed']
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=whatsapp_message) as response:
                    if response.status == 200:
                        logger.info(f"WhatsApp message sent successfully to {phone_number}")
                    else:
                        logger.error(f"WhatsApp message failed: {response.status}")
                        
        except Exception as e:
            logger.error(f"Error sending WhatsApp message to {phone_number}: {e}")

    async def get_user_notification_preferences(self, user_id: str, db: Session) -> Dict:
        """
        Get user's notification preferences from database
        """
        # This would typically query a user_preferences table
        # For now, return default preferences
        return {
            "sms_enabled": True,
            "email_enabled": True,
            "push_enabled": True,
            "whatsapp_enabled": True,
            "min_severity": "MEDIUM"
        }

    async def get_user_push_subscriptions(self, user_id: str, db: Session) -> List[Dict]:
        """
        Get user's push notification subscriptions from database
        """
        # This would typically query a push_subscriptions table
        # For now, return empty list
        return []

    async def register_push_subscription(self, user_id: str, subscription: Dict, db: Session):
        """
        Register a new push notification subscription for a user
        """
        # This would typically insert into a push_subscriptions table
        logger.info(f"Registering push subscription for user {user_id}")

    async def send_test_notification(self, user_id: str, db: Session):
        """
        Send a test notification to verify setup
        """
        # Create a test alert
        from ..models import Alert, AlertType, AlertSeverity
        
        test_alert = Alert(
            farm_id="test-farm",
            pond_id="test-pond",
            type=AlertType.SYSTEM_ERROR,
            severity=AlertSeverity.MEDIUM,
            title="Test de notification",
            message="Ceci est un test de notification du système d'alerte aquacole.",
            parameter="test",
            current_value=0.0,
            threshold_value=0.0
        )
        
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            await self.send_alert_notification(test_alert, [user], db)

# Create global instance
notification_service = NotificationService()