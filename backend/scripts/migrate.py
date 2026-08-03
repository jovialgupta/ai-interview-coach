"""Run migrations/*.sql against DATABASE_URL, in filename order.

Usage: python scripts/migrate.py
"""
import asyncio
import os
import sys
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

load_dotenv()

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"


async def main():
    database_url = os.environ["DATABASE_URL"]
    conn = await asyncpg.connect(database_url)
    try:
        for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
            print(f"Running {path.name} ...")
            sql = path.read_text(encoding="utf-8")
            await conn.execute(sql)
            print(f"  done.")
    finally:
        await conn.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:
        print(f"Migration failed: {exc}", file=sys.stderr)
        sys.exit(1)
