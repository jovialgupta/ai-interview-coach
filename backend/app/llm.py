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
    """Calls the LLM expecting a JSON-only response. Retries the call once on any
    failure — a bad/non-JSON response, or the API call itself raising (network
    error, timeout, rate limit, auth) — then raises a 502 with a user-readable
    message instead of letting the raw exception surface as a 500."""
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            response = await _client.aio.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                    http_options=types.HttpOptions(timeout=15000),
                ),
            )
            cleaned = _strip_code_fences(response.text)
            return json.loads(cleaned)
        except Exception as exc:  # noqa: BLE001 - any failure here is retried once, then surfaced as 502
            last_error = exc
            continue

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="The AI service returned an unexpected response. Please try again.",
    ) from last_error
