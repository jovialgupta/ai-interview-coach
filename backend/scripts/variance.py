"""Scoring variance experiment (Phase 5).

Takes up to 20 saved attempts, scores each one 5 times with the scoring LLM
call, and prints the mean and standard deviation per rubric dimension.

This is a standalone script, not an API endpoint. It writes its extra score
rows into the same `scores` table (an attempt can legitimately be scored more
than once — see SPEC.md's design note on why `scores` is a separate table),
so numbers show up in /api/history too.

Usage:
    python scripts/variance.py
"""
import asyncio
import json
import statistics
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncpg
from dotenv import load_dotenv

from app.config import settings
from app.llm import MODEL, call_llm_json
from app.prompts import build_scoring_prompt

load_dotenv()

ATTEMPT_LIMIT = 20
REPEATS_PER_ATTEMPT = 5
DIMENSIONS = ("structure", "technical_depth", "specificity")


async def fetch_sample_attempts(conn: asyncpg.Connection):
    return await conn.fetch(
        """
        SELECT a.id AS attempt_id, a.answer_text, a.input_mode,
               q.text AS question_text, q.type AS question_type, s.role
        FROM attempts a
        JOIN questions q ON q.id = a.question_id
        JOIN interview_sessions s ON s.id = q.session_id
        ORDER BY a.created_at DESC
        LIMIT $1
        """,
        ATTEMPT_LIMIT,
    )


async def score_once(row) -> dict:
    prompt = build_scoring_prompt(
        role=row["role"],
        question_text=row["question_text"],
        answer_text=row["answer_text"],
        question_type=row["question_type"],
        input_mode=row["input_mode"],
    )
    return await call_llm_json(prompt, temperature=0)


async def store_score(conn: asyncpg.Connection, attempt_id, result: dict) -> None:
    evidence = {dim: result[dim]["evidence"] for dim in DIMENSIONS}
    await conn.execute(
        """
        INSERT INTO scores (attempt_id, structure, technical_depth, specificity, evidence, feedback, model)
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
        """,
        attempt_id,
        result["structure"]["score"],
        result["technical_depth"]["score"],
        result["specificity"]["score"],
        json.dumps(evidence),
        result.get("feedback", ""),
        MODEL,
    )


async def main():
    conn = await asyncpg.connect(settings.database_url)
    try:
        attempts = await fetch_sample_attempts(conn)
        if not attempts:
            print("No saved attempts found. Answer some interview questions first.")
            return
        if len(attempts) < ATTEMPT_LIMIT:
            print(f"Note: only {len(attempts)} attempts available (wanted {ATTEMPT_LIMIT}).")

        per_dimension_scores = {dim: [] for dim in DIMENSIONS}

        for i, row in enumerate(attempts, start=1):
            print(f"\nAttempt {i}/{len(attempts)} ({row['attempt_id']}) — scoring {REPEATS_PER_ATTEMPT}x...")
            attempt_scores = {dim: [] for dim in DIMENSIONS}
            for _ in range(REPEATS_PER_ATTEMPT):
                result = await score_once(row)
                await store_score(conn, row["attempt_id"], result)
                for dim in DIMENSIONS:
                    score = result[dim]["score"]
                    attempt_scores[dim].append(score)
                    per_dimension_scores[dim].append(score)

            for dim in DIMENSIONS:
                values = attempt_scores[dim]
                mean = statistics.mean(values)
                stdev = statistics.stdev(values) if len(values) > 1 else 0.0
                print(f"  {dim:16s} mean={mean:.2f}  stdev={stdev:.2f}  values={values}")

        print("\n=== Overall (all attempts pooled) ===")
        for dim in DIMENSIONS:
            values = per_dimension_scores[dim]
            mean = statistics.mean(values)
            stdev = statistics.stdev(values) if len(values) > 1 else 0.0
            print(f"{dim:16s} mean={mean:.2f}  stdev={stdev:.2f}  n={len(values)}")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())