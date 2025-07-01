from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.schemas.pharmacy import Pharmacy
from app.crud.pharmacy import get_pharmacy, get_pharmacies
from app.database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/pharmacies/", response_model=List[Pharmacy])
def read_pharmacies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    pharmacies = get_pharmacies(db, skip=skip, limit=limit)
    return pharmacies

@router.get("/pharmacies/{pharmacy_id}", response_model=Pharmacy)
def read_pharmacy(pharmacy_id: str, db: Session = Depends(get_db)):
    db_pharmacy = get_pharmacy(db, pharmacy_id=pharmacy_id)
    if db_pharmacy is None:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    return db_pharmacy

@router.get("/pharmacies/search", response_model=List[Pharmacy])
def search_pharmacies(location: str = None, medicine: str = None, db: Session = Depends(get_db)):
    query = db.query(Pharmacy)
    if location:
        query = query.filter(Pharmacy.address.contains(location))
    if medicine:
        query = query.join(Inventory).join(Medicine).filter(Medicine.name.contains(medicine))
    return query.limit(100).all()