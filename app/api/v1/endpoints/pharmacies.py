from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.core.security import get_current_user
from app.models.pharmacy import Pharmacy
from app.models.user import User
from app.schemas.pharmacy import PharmacyCreate, PharmacyUpdate, PharmacyResponse

router = APIRouter()

@router.post("/", response_model=PharmacyResponse)
async def create_pharmacy(
    pharmacy: PharmacyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_pharmacy = Pharmacy(**pharmacy.dict())
    db.add(db_pharmacy)
    db.commit()
    db.refresh(db_pharmacy)
    return db_pharmacy

@router.get("/", response_model=List[PharmacyResponse])
async def read_pharmacies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    city: Optional[str] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Pharmacy)
    
    if city:
        query = query.filter(Pharmacy.city.ilike(f"%{city}%"))
    if state:
        query = query.filter(Pharmacy.state.ilike(f"%{state}%"))
    
    pharmacies = query.offset(skip).limit(limit).all()
    return pharmacies

@router.get("/{pharmacy_id}", response_model=PharmacyResponse)
async def read_pharmacy(pharmacy_id: int, db: Session = Depends(get_db)):
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    if pharmacy is None:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    return pharmacy

@router.put("/{pharmacy_id}", response_model=PharmacyResponse)
async def update_pharmacy(
    pharmacy_id: int,
    pharmacy_update: PharmacyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    if pharmacy is None:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    
    for field, value in pharmacy_update.dict(exclude_unset=True).items():
        setattr(pharmacy, field, value)
    
    db.commit()
    db.refresh(pharmacy)
    return pharmacy

@router.delete("/{pharmacy_id}")
async def delete_pharmacy(
    pharmacy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    if pharmacy is None:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    
    db.delete(pharmacy)
    db.commit()
    return {"message": "Pharmacy deleted successfully"}