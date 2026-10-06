"""Application settings, resolved from the environment with local-dev defaults.

Every value falls back to the original hardcoded setting, so the server still
starts with no `.env` present. Copy `.env.example` to `.env` to override.
"""

import os
from pathlib import Path

# credit_backend/ — two levels up from app/core/config.py
BASE_DIR = Path(__file__).resolve().parents[2]


def _load_dotenv(path: Path) -> None:
    """Read simple KEY=VALUE lines from `path` into the environment.

    Keeps the project dependency-free (python-dotenv is not installed). Real
    environment variables always win, so exported values are never clobbered.
    """
    if not path.is_file():
        return

    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


_load_dotenv(BASE_DIR / ".env")


def _csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings:
    PROJECT_NAME = "Core Credit Scoring API (Enterprise Layer)"

    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:samael@localhost:5433/credit_scoring",
    )

    SECRET_KEY = os.getenv("SECRET_KEY", "FINTARA_SUPER_SECRET_DEMO_KEY_2026")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    CORS_ORIGINS = _csv(os.getenv("CORS_ORIGINS", "*"))

    # Bootstrap accounts, created only when the username does not already exist.
    SEED_USERS = (
        (
            os.getenv("SEED_ADMIN_USERNAME", "admin"),
            os.getenv("SEED_ADMIN_PASSWORD", "admin123"),
            "admin",
        ),
        (
            os.getenv("SEED_OFFICER_USERNAME", "officer"),
            os.getenv("SEED_OFFICER_PASSWORD", "officer123"),
            "officer",
        ),
    )


settings = Settings()
