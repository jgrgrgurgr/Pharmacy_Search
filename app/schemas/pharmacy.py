from pydantic import BaseModel
from typing import Dict, Optional

class PharmacyBase(BaseModel):
    name: str
    address: str
    latitude: Optional[float]
    longitude: Optional[float]
    operating_hours: Dict
    phone: Optional[str]
    status: str

class PharmacyCreate(PharmacyBase):
    pass

class Pharmacy(PharmacyBase):
    id: str
    class Config:
        from_attributes = True