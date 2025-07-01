from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    pharmacy_id = Column(String, ForeignKey("pharmacies.id"))
    medicine_id = Column(Integer, ForeignKey("medicines.id"))
    quantity = Column(Integer)