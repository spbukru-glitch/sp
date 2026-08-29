from datetime import datetime, timezone
from typing import Literal
import uuid

from pydantic import BaseModel, Field


class BookingCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    mobile: str = Field(min_length=7, max_length=30)
    email: str = Field(min_length=5, max_length=160)
    mode: Literal["Online video / audio call", "Office visit", "Door-to-door service"]
    slot: str = Field(min_length=2, max_length=80)
    issue_description: str = Field(min_length=10, max_length=2000)
    document_name: str | None = Field(default=None, max_length=200)


class BookingEvent(BaseModel):
    status: Literal["new", "contacted", "paid", "completed", "closed"]
    changed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Booking(BookingCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: Literal["new", "contacted", "paid", "completed", "closed"] = "new"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    history: list[BookingEvent] = Field(default_factory=list)


class BookingStatusUpdate(BaseModel):
    status: Literal["new", "contacted", "paid", "completed", "closed"]


class BookingTrackRequest(BaseModel):
    id: str = Field(min_length=4, max_length=80)
    mobile: str = Field(min_length=7, max_length=30)


class BookingTracking(BaseModel):
    id: str
    full_name: str
    status: Literal["new", "contacted", "paid", "completed", "closed"]
    mode: str
    slot: str
    created_at: datetime
    history: list[BookingEvent]


class BookingDocumentInfo(BaseModel):
    id: str
    booking_id: str
    filename: str
    content_type: str
    size: int
    uploaded_at: datetime


class AdminLoginRequest(BaseModel):
    password: str = Field(min_length=1, max_length=200)


class AdminLoginResponse(BaseModel):
    authenticated: bool
    message: str


class AdminOverview(BaseModel):
    total_bookings: int
    new_bookings: int
    service_count: int
    pricing_count: int
    content_sections: int


class PriceItem(BaseModel):
    id: str
    name: str
    fee: str
    group: str
    sort_order: int


class PriceItemUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=240)
    fee: str = Field(min_length=1, max_length=80)
    group: str = Field(min_length=2, max_length=80)


class SiteContent(BaseModel):
    about: str
    mission: str
    vision: str
    values: str
    head_office: str
    branch_office: str
    phone: str
    whatsapp: str
    email: str
    hours: str
    hero_image: str
    global_image: str
    trust_image: str
    leader_image: str
    leader_name: str
    leader_title: str


class SiteContentUpdate(SiteContent):
    pass