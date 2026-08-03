import io
import json

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from pypdf import PdfReader

from app.db import get_pool
from app.deps import get_current_user
from app.llm import call_llm_json
from app.prompts import build_resume_extraction_prompt
from app.schemas import ResumePasteRequest, ResumeResponse

router = APIRouter(prefix="/api/resume", tags=["resume"])

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MIN_EXTRACTED_CHARS = 100


async def _extract_and_store(user_id: str, resume_text: str) -> ResumeResponse:
    prompt = build_resume_extraction_prompt(resume_text)
    parsed = await call_llm_json(prompt, temperature=0)

    pool = get_pool()
    await pool.execute(
        """
        UPDATE users
        SET resume_text = $1, resume_parsed = $2::jsonb, resume_uploaded_at = now()
        WHERE id = $3
        """,
        resume_text,
        json.dumps(parsed),
        user_id,
    )
    return ResumeResponse(resume_parsed=parsed)


@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(file: UploadFile, user_id: str = Depends(get_current_user)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be a PDF.")

    raw = await file.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be 5 MB or smaller.")

    reader = PdfReader(io.BytesIO(raw))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)

    if len(text.strip()) < MIN_EXTRACTED_CHARS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="We couldn't read text from this PDF (it may be a scanned image). "
            "Please paste your details instead.",
        )

    return await _extract_and_store(user_id, text)


@router.post("/paste", response_model=ResumeResponse)
async def paste_resume(body: ResumePasteRequest, user_id: str = Depends(get_current_user)):
    return await _extract_and_store(user_id, body.context_text)
