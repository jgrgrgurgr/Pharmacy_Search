from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.feedback import FeedbackType

class FeedbackBase(BaseModel):
    pharmacy_id: int
    customer_name: str
    customer_email: EmailStr
    feedback_type: FeedbackType
    rating: float  # 1-5 scale
    comments: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackResponse(FeedbackBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True