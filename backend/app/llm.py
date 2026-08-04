import json
import re

from fastapi import HTTPException, status
from google import genai
from google.genai import types

from app.config import settings

MODEL = "gemini-3.6-flash"

_client = genai.Client(api_key=settings.gemini_api_key)

_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def _strip_code_fences(text: str) -> str:
    return _FENCE_RE.sub("", text.strip()).strip()


async def call_llm_json(prompt: str, temperature: float, max_tokens: int = 2000) -> dict:
    """Calls the LLM expecting a JSON-only response. Retries the call once on
    JSONDecodeError, then raises a 502 with a user-readable message."""
    last_error: Exception | None = None
    for attempt in range(2):
        response = await _client.aio.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )
        cleaned = _strip_code_fences(response.text)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            last_error = exc
            continue

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="The AI service returned an unexpected response. Please try again.",
    ) from last_error
