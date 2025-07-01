from sqlalchemy.orm import Session
from app.models.pharmacy import Pharmacy

def get_pharmacy(db: Session, pharmacy_id: str):
return db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()

def get_pharmacies(db: Session, skip: int = 0, limit: int = 100):
return db.query(Pharmacy).offset(skip).limit(limit).all()
