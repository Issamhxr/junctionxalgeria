from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import init_db
from app.api.v1 import auth, farms, ponds, sensors, alerts, sensor_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    pass


app = FastAPI(
    title="Smart Aquaculture Management System",
    description="FastAPI backend for aquaculture monitoring and management",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add GZip middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(farms.router, prefix="/api/v1/farms", tags=["farms"])
app.include_router(ponds.router, prefix="/api/v1/ponds", tags=["ponds"])
app.include_router(sensors.router, prefix="/api/v1/sensors", tags=["sensors"])
app.include_router(sensor_data.router, prefix="/api/v1/sensor-data", tags=["sensor-data"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])


@app.get("/")
async def root():
    return {"message": "Smart Aquaculture Management System API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)