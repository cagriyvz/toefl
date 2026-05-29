from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.routers import auth, classrooms, assignments, notes
import app.models.notes

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lexi API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(classrooms.router)
app.include_router(assignments.router)
app.include_router(notes.router)

@app.get("/")
def root():
    return {"message": "Lexi API çalışıyor 🚀", "docs": "/docs"}
