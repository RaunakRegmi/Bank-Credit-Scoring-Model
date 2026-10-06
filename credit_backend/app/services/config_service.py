"""Reads and writes the active scoring rule matrix."""

from fastapi import HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.db.models import ScoringConfig


def get_active_config(db: Session) -> ScoringConfig | None:
    """Newest active configuration row, or None when the table has no active row."""
    return (
        db.query(ScoringConfig)
        .filter(ScoringConfig.is_active.is_(True))
        .order_by(desc(ScoringConfig.config_id))
        .first()
    )


def require_active_config(db: Session) -> ScoringConfig:
    """As get_active_config, but 503s instead of returning None.

    The engine cannot score anything without a rule matrix, so a missing row is
    an unavailable service rather than a bad request.
    """
    config = get_active_config(db)
    if config is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No active scoring configuration found",
        )
    return config


def get_active_rules(db: Session) -> dict:
    return require_active_config(db).rules


def update_active_rules(db: Session, new_rules: dict) -> None:
    config = require_active_config(db)
    config.rules = new_rules

    # SQLAlchemy does not detect in-place mutation of JSONB values, so the
    # column has to be flagged dirty explicitly or the commit is a no-op.
    flag_modified(config, "rules")
    db.commit()
