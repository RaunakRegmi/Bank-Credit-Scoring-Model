"""Table creation and bootstrap user seeding, run once at application startup."""

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.models import User
from app.db.session import SessionLocal, engine


def seed_users(db: Session) -> None:
    """Create any missing bootstrap account, leaving existing ones untouched."""
    missing = [
        User(username=username, hashed_password=get_password_hash(password), role=role)
        for username, password, role in settings.SEED_USERS
        if not db.query(User).filter(User.username == username).first()
    ]
    if missing:
        db.add_all(missing)
        db.commit()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_users(db)
    finally:
        db.close()
