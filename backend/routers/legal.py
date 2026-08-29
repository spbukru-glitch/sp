import os
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Cookie, HTTPException, Request, Response, status

from lib.db import db
from models.legal import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminOverview,
    Booking,
    BookingCreate,
)

router = APIRouter()
_admin_sessions: set[str] = set()
_service_count = 6
_pricing_count = 35
_content_sections = 8


def _require_admin(admin_session: str | None) -> None:
    if not admin_session or admin_session not in _admin_sessions:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin login required")


def _normalise_booking(document: dict) -> Booking:
    created_at = document.get("created_at")
    if isinstance(created_at, datetime) and created_at.tzinfo is None:
        document["created_at"] = created_at.replace(tzinfo=timezone.utc)
    return Booking(**document)


@router.post("/bookings", response_model=Booking, status_code=status.HTTP_201_CREATED)
async def create_booking(payload: BookingCreate) -> Booking:
    booking = Booking(**payload.model_dump())
    await db.bookings.insert_one(booking.model_dump())
    return booking


@router.post("/admin/login", response_model=AdminLoginResponse)
async def admin_login(payload: AdminLoginRequest, response: Response) -> AdminLoginResponse:
    expected_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    if not secrets.compare_digest(payload.password, expected_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect admin password")

    token = secrets.token_urlsafe(32)
    _admin_sessions.add(token)
    response.set_cookie(
        "admin_session",
        token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 8,
    )
    return AdminLoginResponse(authenticated=True, message="Welcome to the SpLegalMart admin desk")


@router.post("/admin/logout", status_code=status.HTTP_204_NO_CONTENT)
async def admin_logout(response: Response, admin_session: str | None = Cookie(default=None)) -> Response:
    if admin_session:
        _admin_sessions.discard(admin_session)
    response.delete_cookie("admin_session")
    return response


@router.get("/admin/overview", response_model=AdminOverview)
async def admin_overview(admin_session: str | None = Cookie(default=None)) -> AdminOverview:
    _require_admin(admin_session)
    total = await db.bookings.count_documents({})
    new = await db.bookings.count_documents({"status": "new"})
    return AdminOverview(
        total_bookings=total,
        new_bookings=new,
        service_count=_service_count,
        pricing_count=_pricing_count,
        content_sections=_content_sections,
    )


@router.get("/admin/bookings", response_model=list[Booking])
async def admin_bookings(admin_session: str | None = Cookie(default=None)) -> list[Booking]:
    _require_admin(admin_session)
    documents = await db.bookings.find().sort("created_at", -1).to_list(1000)
    return [_normalise_booking(document) for document in documents]