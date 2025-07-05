from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InventoryBase(BaseModel):
    pharmacy_id: int
    medicine_id: int
    quantity: int
    reorder_level: int = 10
    unit_cost: float
    expiry_date: datetime
    batch_number: str

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    quantity: Optional[int] = None
    reorder_level: Optional[int] = None
    unit_cost: Optional[float] = None
    expiry_date: Optional[datetime] = None
    batch_number: Optional[str] = None

class InventoryResponse(InventoryBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True