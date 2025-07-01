from fastapi import FastAPI, Depends, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.api.endpoints import pharmacies, inventory, feedback, users

app = FastAPI()
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.include_router(pharmacies.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(users.router, prefix="/api")

@app.get("/")
async def main_page(request: Request, db: Session = Depends(get_db)):
    from app.crud.pharmacy import get_pharmacies
    pharmacies = get_pharmacies(db, skip=0, limit=10)
    return templates.TemplateResponse("main.html", {"request": request, "pharmacies": pharmacies})