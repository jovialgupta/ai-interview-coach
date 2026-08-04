
from app.routers import attempts, auth, history, me , resume, sessions
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import connect_db, disconnect_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield 
    await disconnect_db()

app = FastAPI(title="AI Interview Prep API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(me.router)
app.include_router(resume.router)
app.include_router(sessions.router)
app.include_router(attempts.router)
app.include_router(history.router)


@app.get("/health")
async def health():
    return {"status": "ok"}