from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    # Database Configuration
    db_host: str = "pg-2028d99a-lokmaneelhakimbaslimane-a34b.c.aivencloud.com"
    db_port: str = "25683"
    db_name: str = "aqua"
    db_user: str = "avnadmin"
    db_password: str = "AVNS_Nv-pBMnCYwTl1eyFMCW"
    database_url: str = "postgresql://avnadmin:AVNS_Nv-pBMnCYwTl1eyFMCW@pg-2028d99a-lokmaneelhakimbaslimane-a34b.c.aivencloud.com:25683/defaultdb?sslmode=require"
    
    # Server Configuration
    node_env: str = "production"
    port: str = "5000"
    frontend_url: str = "http://localhost:3000"
    
    # Data Simulation
    enable_data_simulation: str = "true"
    
    # JWT Configuration
    jwt_secret: str = "your_jwt_secret_here_replace_with_secure_key"
    jwt_expires_in: str = "24h"
    secret_key: str = "your_jwt_secret_here_replace_with_secure_key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Twilio Configuration
    twilio_account_sid: str = "your_twilio_sid"
    twilio_auth_token: str = "your_twilio_token"
    twilio_phone_number: str = "your_twilio_phone"
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"  # Allow extra fields that aren't defined in the model

settings = Settings()
