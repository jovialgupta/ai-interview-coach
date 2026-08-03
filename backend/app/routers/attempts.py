import json

from fastapi import APIRouter, Depends, HTTPException, status

from app.db import get_pool
from app.deps import get_current_user
from app.llm import MODEL, call_llm_json
from app.prompts import build_scoring_prompt
from app.schemas import AttemptScoreResponse, CreateAttemptRequest

router = APIRouter(prefix="/api/attempts", tags=["attempts"])


async def _score_and_store(attempt_id: str, role: str, question_text: str, question_type: str,
                            answer_text: str, input_mode: str) -> AttemptScoreResponse:
    prompt = build_scoring_prompt(
        role=role,
        question_text=question_text,
        answer_text=answer_text,
        question_type=question_type,
        input_mode=input_mode,
    )
    result = await call_llm_json(prompt, temperature=0)

    structure = result["structure"]["score"]
    technical_depth = result["technical_depth"]["score"]
    specificity = result["specificity"]["score"]
    evidence = {
        "structure": result["structure"]["evidence"],
        "technical_depth": result["technical_depth"]["evidence"],
        "specificity": result["specificity"]["evidence"],
    }
    feedback = result["feedback"]

    pool = get_pool()
    await pool.execute(
        """
        INSERT INTO scores (attempt_id, structure, technical_depth, specificity, evidence, feedback, model)
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
        """,
        attempt_id,
        structure,
        technical_depth,
        specificity,
        json.dumps(evidence),
        feedback,
        MODEL,
    )

    return AttemptScoreResponse(
        structure=structure,
        technical_depth=technical_depth,
        specificity=specificity,
        evidence=evidence,
        feedback=feedback,
        model=MODEL,
    )


@router.post("", response_model=AttemptScoreResponse)
async def create_attempt(body: CreateAttemptRequest, user_id: str = Depends(get_current_user)):
    if not body.answer_text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Answer cannot be empty.")

    pool = get_pool()

    question_row = await pool.fetchrow(
        """
        SELECT q.id, q.text, q.type, s.role, s.user_id
        FROM questions q
        JOIN interview_sessions s ON s.id = q.session_id
        WHERE q.id = $1
        """,
        body.question_id,
    )
    if question_row is None or str(question_row["user_id"]) != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

    # Saved before scoring: if the LLM call below times out or fails, the answer
    # is never lost — the frontend can retry via POST /:attempt_id/rescore.
    attempt_row = await pool.fetchrow(
        """
        INSERT INTO attempts (question_id, user_id, answer_text, input_mode)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        """,
        body.question_id,
        user_id,
        body.answer_text,
        body.input_mode,
    )
    attempt_id = attempt_row["id"]

    return await _score_and_store(
        attempt_id=attempt_id,
        role=question_row["role"],
        question_text=question_row["text"],
        question_type=question_row["type"],
        answer_text=body.answer_text,
        input_mode=body.input_mode,
    )


@router.post("/{attempt_id}/rescore", response_model=AttemptScoreResponse)
async def rescore_attempt(attempt_id: str, user_id: str = Depends(get_current_user)):
    """Retry scoring for an already-saved attempt, e.g. after the initial LLM call
    timed out. Never re-inserts the attempt or its answer text."""
    pool = get_pool()

    row = await pool.fetchrow(
        """
        SELECT a.answer_text, a.input_mode, q.text AS question_text, q.type AS question_type, s.role
        FROM attempts a
        JOIN questions q ON q.id = a.question_id
        JOIN interview_sessions s ON s.id = q.session_id
        WHERE a.id = $1 AND a.user_id = $2
        """,
        attempt_id,
        user_id,
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found.")

    return await _score_and_store(
        attempt_id=attempt_id,
        role=row["role"],
        question_text=row["question_text"],
        question_type=row["question_type"],
        answer_text=row["answer_text"],
        input_mode=row["input_mode"],
    )
