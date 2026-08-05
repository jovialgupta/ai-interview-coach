from fastapi import APIRouter, Depends, HTTPException, status

from app.db import get_pool
from app.deps import get_current_user
from app.schemas import MeResponse

router = APIRouter(prefix="/api", tags=["me"])


@router.get("/me", response_model=MeResponse)
async def me(user_id: str = Depends(get_current_user)):
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT id, email, name, resume_uploaded_at, created_at FROM users WHERE id = $1",
        user_id,
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return MeResponse(
        id=str(row["id"]),
        email=row["email"],
        name=row["name"],
        has_resume=row["resume_uploaded_at"] is not None,
        resume_uploaded_at=row["resume_uploaded_at"],
        created_at=row["created_at"],
    )
