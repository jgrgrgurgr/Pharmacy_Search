from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.core.security import get_current_user
from app.models.inventory import Inventory
from app.models.user import User
from app.schemas.inventory import InventoryCreate, InventoryUpdate, InventoryResponse

router = APIRouter()

@router.post("/", response_model=InventoryResponse)
async def create_inventory_item(
    inventory: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_inventory = Inventory(**inventory.dict())
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory

@router.get("/", response_model=List[InventoryResponse])
async def read_inventory(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    pharmacy_id: Optional[int] = None,
    low_stock: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Inventory)
    
    if pharmacy_id:
        query = query.filter(Inventory.pharmacy_id == pharmacy_id)
    
    if low_stock:
        query = query.filter(Inventory.quantity <= Inventory.reorder_level)
    
    inventory = query.offset(skip).limit(limit).all()
    return inventory

@router.get("/{inventory_id}", response_model=InventoryResponse)
async def read_inventory_item(inventory_id: int, db: Session = Depends(get_db)):
    inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if inventory is None:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return inventory

@router.put("/{inventory_id}", response_model=InventoryResponse)
async def update_inventory_item(
    inventory_id: int,
    inventory_update: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if inventory is None:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    for field, value in inventory_update.dict(exclude_unset=True).items():
        setattr(inventory, field, value)
    
    db.commit()
    db.refresh(inventory)
    return inventory

@router.delete("/{inventory_id}")
async def delete_inventory_item(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if inventory is None:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    db.delete(inventory)
    db.commit()
    return {"message": "Inventory item deleted successfully"}