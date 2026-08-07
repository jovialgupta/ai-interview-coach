import difflib
import json

from fastapi import APIRouter, Depends, HTTPException, status

from app.db import get_pool
from app.deps import get_current_user
from app.llm import call_llm_json
from app.prompts import build_question_generation_prompt
from app.schemas import AttemptScoreResponse, CreateSessionRequest, QuestionOut, SessionListItem, SessionOut

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# A generated question counts as a repeat of one already asked in this session
# if they're this similar — catches near-duplicate rephrasings, not just exact matches.
SIMILARITY_THRESHOLD = 0.82
MAX_GENERATION_ATTEMPTS = 3


def _is_too_similar(candidate: str, existing: list[str]) -> bool:
    candidate_norm = candidate.strip().lower()
    return any(
        difflib.SequenceMatcher(None, candidate_norm, text.strip().lower()).ratio() >= SIMILARITY_THRESHOLD
        for text in existing
    )


async def _generate_one_question(
    pool, user_id: str, role: str, interview_type: str, difficulty: str, avoid_texts: list[str]
) -> dict:
    """Generates a single question, retrying (with the near-duplicate added to the
    avoid-list) if it's too similar to one already asked. Gives up and returns the
    last candidate after MAX_GENERATION_ATTEMPTS rather than failing the request."""
    user_row = await pool.fetchrow("SELECT resume_parsed FROM users WHERE id = $1", user_id)
    resume_parsed = user_row["resume_parsed"] if user_row else None
    resume_parsed_json = resume_parsed if resume_parsed else "(no resume on file)"

    candidate = None
    for _ in range(MAX_GENERATION_ATTEMPTS):
        prompt = build_question_generation_prompt(
            role=role,
            interview_type=interview_type,
            difficulty=difficulty,
            question_count=1,
            resume_parsed_json=resume_parsed_json,
            previous_questions="\n".join(f"- {t}" for t in avoid_texts),
        )
        generated = await call_llm_json(prompt, temperature=0.9)
        questions = generated.get("questions", [])
        if not questions or not all(isinstance(q, dict) and q.get("text") for q in questions):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI service did not return a question. Please try again.",
            )
        candidate = questions[0]
        if not _is_too_similar(candidate["text"], avoid_texts):
            return candidate
        avoid_texts = [*avoid_texts, candidate["text"]]

    return candidate


@router.post("", response_model=SessionOut)
async def create_session(body: CreateSessionRequest, user_id: str = Depends(get_current_user)):
    pool = get_pool()

    previous_rows = await pool.fetch(
        """
        SELECT q.text
        FROM questions q
        JOIN interview_sessions s ON s.id = q.session_id
        WHERE s.user_id = $1
        ORDER BY s.created_at DESC, q.order_index DESC
        LIMIT 30
        """,
        user_id,
    )
    avoid_texts = [r["text"] for r in previous_rows]

    question = await _generate_one_question(
        pool, user_id, body.role, body.interview_type, body.difficulty, avoid_texts
    )

    async with pool.acquire() as conn:
        async with conn.transaction():
            session_row = await conn.fetchrow(
                """
                INSERT INTO interview_sessions (user_id, role, difficulty, interview_type, question_count)
                VALUES ($1, $2, $3, $4, NULL)
                RETURNING id, role, difficulty, interview_type, question_count, created_at
                """,
                user_id,
                body.role,
                body.difficulty,
                body.interview_type,
            )
            session_id = session_row["id"]

            question_row = await conn.fetchrow(
                """
                INSERT INTO questions (session_id, text, type, targets, order_index)
                VALUES ($1, $2, $3, $4, 0)
                RETURNING id, text, type, targets, order_index
                """,
                session_id,
                question["text"],
                question.get("type", "technical"),
                question.get("targets"),
            )

    return SessionOut(
        id=str(session_row["id"]),
        role=session_row["role"],
        difficulty=session_row["difficulty"],
        interview_type=session_row["interview_type"],
        question_count=session_row["question_count"],
        created_at=session_row["created_at"],
        questions=[
            QuestionOut(
                id=str(question_row["id"]),
                text=question_row["text"],
                type=question_row["type"],
                targets=question_row["targets"],
                order_index=question_row["order_index"],
            )
        ],
    )


@router.post("/{session_id}/next", response_model=QuestionOut)
async def next_question(session_id: str, user_id: str = Depends(get_current_user)):
    pool = get_pool()
    session_row = await pool.fetchrow(
        """
        SELECT role, difficulty, interview_type, question_count
        FROM interview_sessions
        WHERE id = $1 AND user_id = $2
        """,
        session_id,
        user_id,
    )
    if session_row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
    if session_row["question_count"] is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This session has already finished.")

    existing_rows = await pool.fetch(
        "SELECT text, order_index FROM questions WHERE session_id = $1 ORDER BY order_index ASC",
        session_id,
    )
    avoid_texts = [r["text"] for r in existing_rows]
    next_index = (existing_rows[-1]["order_index"] + 1) if existing_rows else 0

    question = await _generate_one_question(
        pool,
        user_id,
        session_row["role"],
        session_row["interview_type"],
        session_row["difficulty"],
        avoid_texts,
    )

    row = await pool.fetchrow(
        """
        INSERT INTO questions (session_id, text, type, targets, order_index)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, text, type, targets, order_index
        """,
        session_id,
        question["text"],
        question.get("type", "technical"),
        question.get("targets"),
        next_index,
    )

    return QuestionOut(
        id=str(row["id"]),
        text=row["text"],
        type=row["type"],
        targets=row["targets"],
        order_index=row["order_index"],
    )


@router.post("/{session_id}/finish", response_model=SessionOut)
async def finish_session(session_id: str, user_id: str = Depends(get_current_user)):
    pool = get_pool()
    row = await pool.fetchrow(
        """
        UPDATE interview_sessions
        SET question_count = (SELECT COUNT(*) FROM questions WHERE session_id = interview_sessions.id),
            finished_at = now()
        WHERE id = $1 AND user_id = $2
        RETURNING id, role, difficulty, interview_type, question_count, created_at
        """,
        session_id,
        user_id,
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    return SessionOut(
        id=str(row["id"]),
        role=row["role"],
        difficulty=row["difficulty"],
        interview_type=row["interview_type"],
        question_count=row["question_count"],
        created_at=row["created_at"],
        questions=[],
    )


@router.get("/{session_id}", response_model=SessionOut)
async def get_session(session_id: str, user_id: str = Depends(get_current_user)):
    pool = get_pool()
    session_row = await pool.fetchrow(
        """
        SELECT id, role, difficulty, interview_type, question_count, created_at
        FROM interview_sessions
        WHERE id = $1 AND user_id = $2
        """,
        session_id,
        user_id,
    )
    if session_row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    question_rows = await pool.fetch(
        """
        SELECT
            q.id, q.text, q.type, q.targets, q.order_index,
            a.id AS attempt_id, s.structure, s.technical_depth, s.specificity,
            s.evidence, s.feedback, s.model
        FROM questions q
        LEFT JOIN LATERAL (
            SELECT a.id
            FROM attempts a
            JOIN scores sc ON sc.attempt_id = a.id
            WHERE a.question_id = q.id
            ORDER BY sc.created_at DESC
            LIMIT 1
        ) a ON true
        LEFT JOIN scores s ON s.attempt_id = a.id
        WHERE q.session_id = $1
        ORDER BY q.order_index ASC
        """,
        session_id,
    )

    return SessionOut(
        id=str(session_row["id"]),
        role=session_row["role"],
        difficulty=session_row["difficulty"],
        interview_type=session_row["interview_type"],
        question_count=session_row["question_count"],
        created_at=session_row["created_at"],
        questions=[
            QuestionOut(
                id=str(r["id"]),
                text=r["text"],
                type=r["type"],
                targets=r["targets"],
                order_index=r["order_index"],
                attempt=(
                    AttemptScoreResponse(
                        attempt_id=str(r["attempt_id"]),
                        structure=r["structure"],
                        technical_depth=r["technical_depth"],
                        specificity=r["specificity"],
                        evidence=json.loads(r["evidence"]) if isinstance(r["evidence"], str) else (r["evidence"] or {}),
                        feedback=r["feedback"],
                        model=r["model"],
                    )
                    if r["attempt_id"] is not None
                    else None
                ),
            )
            for r in question_rows
        ],
    )


@router.get("", response_model=list[SessionListItem])
async def list_sessions(user_id: str = Depends(get_current_user)):
    pool = get_pool()
    rows = await pool.fetch(
        """
        SELECT id, role, difficulty, interview_type, question_count, created_at
        FROM interview_sessions
        WHERE user_id = $1
        ORDER BY created_at DESC
        """,
        user_id,
    )
    return [
        SessionListItem(
            id=str(r["id"]),
            role=r["role"],
            difficulty=r["difficulty"],
            interview_type=r["interview_type"],
            question_count=r["question_count"],
            created_at=r["created_at"],
        )
        for r in rows
    ]
