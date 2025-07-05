from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class PharmacyBase(BaseModel):
    name: str
    license_number: str
    address: str
    city: str
    state: str
    zip_code: str
    phone: str
    email: EmailStr
    owner_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class PharmacyCreate(PharmacyBase):
    pass

class PharmacyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    owner_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: Optional[bool] = None

class PharmacyResponse(PharmacyBase):
    id: int
    is_active: bool
    quality_score: float
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True