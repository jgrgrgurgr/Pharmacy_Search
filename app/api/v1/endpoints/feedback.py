from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.core.security import get_current_user
from app.models.feedback import Feedback
from app.models.pharmacy import Pharmacy
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackResponse

router = APIRouter()

@router.post("/", response_model=FeedbackResponse)
async def create_feedback(
    feedback: FeedbackCreate,
    db: Session = Depends(get_db)
):
    # Verify pharmacy exists
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == feedback.pharmacy_id).first()
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    
    db_feedback = Feedback(**feedback.dict())
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    
    # Update pharmacy quality score
    avg_rating = db.query(func.avg(Feedback.rating)).filter(
        Feedback.pharmacy_id == feedback.pharmacy_id
    ).scalar()
    
    pharmacy.quality_score = float(avg_rating) if avg_rating else 0.0
    db.commit()
    
    return db_feedback

@router.get("/", response_model=List[FeedbackResponse])
async def read_feedback(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    pharmacy_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Feedback)
    
    if pharmacy_id:
        query = query.filter(Feedback.pharmacy_id == pharmacy_id)
    
    feedback = query.offset(skip).limit(limit).all()
    return feedback

@router.get("/{feedback_id}", response_model=FeedbackResponse)
async def read_feedback_item(feedback_id: int, db: Session = Depends(get_db)):
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return feedback

@router.get("/pharmacy/{pharmacy_id}/stats")
async def get_pharmacy_feedback_stats(pharmacy_id: int, db: Session = Depends(get_db)):
    # Verify pharmacy exists
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    
    stats = db.query(
        func.count(Feedback.id).label('total_feedback'),
        func.avg(Feedback.rating).label('average_rating'),
        func.min(Feedback.rating).label('min_rating'),
        func.max(Feedback.rating).label('max_rating')
    ).filter(Feedback.pharmacy_id == pharmacy_id).first()
    
    return {
        "pharmacy_id": pharmacy_id,
        "total_feedback": stats.total_feedback or 0,
        "average_rating": float(stats.average_rating) if stats.average_rating else 0.0,
        "min_rating": float(stats.min_rating) if stats.min_rating else 0.0,
        "max_rating": float(stats.max_rating) if stats.max_rating else 0.0
    }