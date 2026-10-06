"""Shared FastAPI dependencies: database sessions and the authenticated user."""

from typing import Generator

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.models import User
from app.db.session import SessionLocal

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_db() -> Generator[Session, None, None]:
    """Yield a session per request and always close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _credentials_error(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the bearer token to a user row, or 401."""
    try:
        payload = decode_access_token(token)
    except jwt.PyJWTError:
        raise _credentials_error("Invalid credentials")

    username = payload.get("sub")
    if not username:
        raise _credentials_error("Invalid credentials")

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise _credentials_error("User not found")
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Gate routes that mutate engine configuration."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator role required",
        )
    return current_user
