"""Live editing of the scoring rule matrix."""

from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_admin
from app.schemas.common import Message
from app.services import config_service

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/config")
def get_config(
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> dict:
    """Return the active rule matrix verbatim for the settings editor."""
    return config_service.get_active_rules(db)


@router.put("/config", response_model=Message)
def update_config(
    new_rules: dict = Body(...),
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
) -> Message:
    config_service.update_active_rules(db, new_rules)
    return Message(message="Configuration updated successfully")
