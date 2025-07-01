from sqlalchemy import Column, String, Float, JSON, Enum
from app.database import Base

class Pharmacy(Base):
    __tablename__ = "pharmacies"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    operating_hours = Column(JSON)
    phone = Column(String, nullable=True)
    status = Column(Enum("active", "inactive"), default="active")