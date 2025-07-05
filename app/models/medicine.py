from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    generic_name = Column(String(100), nullable=False)
    manufacturer = Column(String(100), nullable=False)
    dosage_form = Column(String(50), nullable=False)
    strength = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    unit_price = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())