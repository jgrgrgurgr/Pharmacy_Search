from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "mysql+pymysql://pharmacy_user:root@1234:3306/pharmacy_db"
    
    # Security
    SECRET_KEY: str = "FH3fivjwNsdp8hVWBT7wIF/2Hxi7gQIA7bu19DxYK6Ld111bKFoCRHDw2AL5nq9Oa48+2pa+ktvsGWO3kcjupQ=="
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:8000"]
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()