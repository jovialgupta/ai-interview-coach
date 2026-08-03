from fastapi import FastAPI

app = FastAPI(title="AI Interview Prep API")


@app.get("/health")
async def health():
    return {"status": "ok"}
