from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class FeedbackType(enum.Enum):
    SERVICE_QUALITY = "service_quality"
    PRODUCT_QUALITY = "product_quality"
    STAFF_BEHAVIOR = "staff_behavior"
    CLEANLINESS = "cleanliness"
    WAITING_TIME = "waiting_time"

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    pharmacy_id = Column(Integer, ForeignKey("pharmacies.id"), nullable=False)
    customer_name = Column(String(100), nullable=False)
    customer_email = Column(String(100), nullable=False)
    feedback_type = Column(Enum(FeedbackType), nullable=False)
    rating = Column(Float, nullable=False)  # 1-5 scale
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    pharmacy = relationship("Pharmacy")