"""Aggregates every route module into a single router."""

from fastapi import APIRouter

from app.api.routes import auth, dashboard, evaluate, settings

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(evaluate.router)
api_router.include_router(dashboard.router)
api_router.include_router(settings.router)
