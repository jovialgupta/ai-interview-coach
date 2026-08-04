from fastapi import APIRouter, Depends

from app.db import get_pool
from app.deps import get_current_user
from app.schemas import HistoryItem

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=list[HistoryItem])
async def get_history(user_id: str = Depends(get_current_user)):
    pool = get_pool()
    # Ownership is filtered on attempts.user_id directly (denormalised column) —
    # the joins below are for display data only, not for the ownership check.
    rows = await pool.fetch(
        """
        SELECT
            a.id AS attempt_id,
            sess.id AS session_id,
            a.answer_text,
            a.input_mode,
            q.text AS question_text,
            q.type AS question_type,
            s.structure,
            s.technical_depth,
            s.specificity,
            s.feedback,
            s.created_at AS scored_at
        FROM attempts a
        JOIN scores s ON s.attempt_id = a.id
        LEFT JOIN questions q ON q.id = a.question_id
        LEFT JOIN interview_sessions sess ON sess.id = q.session_id
        WHERE a.user_id = $1
        ORDER BY s.created_at ASC
        """,
        user_id,
    )
    return [
        HistoryItem(
            attempt_id=str(r["attempt_id"]),
            session_id=str(r["session_id"]),
            question_text=r["question_text"] or "",
            question_type=r["question_type"] or "",
            answer_text=r["answer_text"],
            input_mode=r["input_mode"],
            structure=r["structure"],
            technical_depth=r["technical_depth"],
            specificity=r["specificity"],
            feedback=r["feedback"],
            scored_at=r["scored_at"],
        )
        for r in rows
    ]
