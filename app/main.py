from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import uvicorn
import os
from pathlib import Path

from app.core.config import settings
from app.core.security import get_current_user
from app.database import engine, Base
from app.api.v1.endpoints import pharmacies, inventory, users, feedback

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Pharmacy Service Quality Monitoring System",
    description="A comprehensive system for monitoring pharmacy service quality",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Configure templates
templates = Jinja2Templates(directory="templates")

# Include API routers
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(pharmacies.router, prefix="/api/v1/pharmacies", tags=["pharmacies"])
app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["inventory"])
app.include_router(feedback.router, prefix="/api/v1/feedback", tags=["feedback"])

@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open("index.html", "r") as f:
        return HTMLResponse(content=f.read())

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard():
    with open("dashboard.html", "r") as f:
        return HTMLResponse(content=f.read())

@app.get("/pharmacies", response_class=HTMLResponse)
async def pharmacies_page():
    with open("pharmacies.html", "r") as f:
        return HTMLResponse(content=f.read())

@app.get("/inventory", response_class=HTMLResponse)
async def inventory_page():
    with open("inventory.html", "r") as f:
        return HTMLResponse(content=f.read())

@app.get("/feedback", response_class=HTMLResponse)
async def feedback_page():
    with open("feedback.html", "r") as f:
        return HTMLResponse(content=f.read())

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Pharmacy monitoring system is running"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )