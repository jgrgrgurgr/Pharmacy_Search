from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime
from app.database import Base

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    pharmacy_id = Column(String, ForeignKey("pharmacies.id"))
    content = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)