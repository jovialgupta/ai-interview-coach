import asyncpg
from fastapi import APIRouter, HTTPException, status

from app.db import get_pool
from app.schemas import LoginRequest, SignupRequest, TokenResponse
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse)
async def signup(body: SignupRequest):
    pool = get_pool()
    password_hash = hash_password(body.password)
    try:
        row = await pool.fetchrow(
            "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id",
            body.email,
            password_hash,
            body.name,
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    token = create_access_token(str(row["id"]))
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT id, password_hash FROM users WHERE email = $1",
        body.email,
    )
    if row is None or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    token = create_access_token(str(row["id"]))
    return TokenResponse(access_token=token)
