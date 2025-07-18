from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    database_url: str = "postgresql://avnadmin:AVNS_aFKLQGIGST5EGOAiVPt@pg-3e5ba5fb-issamhxr-e2b3.g.aivencloud.com:13042/defaultdb?sslmode=require"
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    redis_url: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
