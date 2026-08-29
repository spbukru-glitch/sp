import os
import secrets
import textwrap
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Cookie, HTTPException, Request, Response, status

from lib.db import db
from models.legal import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminOverview,
    Booking,
    BookingCreate,
    BookingStatusUpdate,
    PriceItem,
    PriceItemUpdate,
    SiteContent,
    SiteContentUpdate,
)

router = APIRouter()
_admin_sessions: set[str] = set()
_service_count = 6
_content_sections = 8
PAYMENT_QR_URL = "https://customer-assets-0z36b82j.emergentagent.net/job_legal-one-roof/artifacts/l7dh0l55_qr.html.png"

DEFAULT_CONTENT = {
    "id": "site-content",
    "about": "SpLegalMart is a premier international legal consultancy and service integration platform. Every legal matter is unique; we understand the circumstances, identify the right strategy, and work diligently toward a successful outcome.",
    "mission": "Our mission is to provide accessible, affordable, and professional legal solutions globally — protecting interests, resolving challenges, and making confident legal action possible regardless of location.",
    "vision": "Ethical, innovative and exceptional legal service on a national and international scale.",
    "values": "Integrity, excellence, confidentiality, accountability and a client-first approach.",
    "head_office": "Bawana, Delhi – 110040, India",
    "branch_office": "Bukru, Kanke, Ranchi, Jharkhand – 834006, India",
    "phone": "+91 7992461191 / 9650323162",
    "whatsapp": "+91 7992461191",
    "email": "splegalmart@gmail.com",
    "hours": "24/7 — round the clock",
}

PRICE_LIST = [
    ("Initial online consultation (10 min)", "Rs. 199"),
    ("Detailed online consultation (30 min)", "Rs. 499"),
    ("Detailed online consultation (1 hour)", "Rs. 999"),
    ("Office / offline consultation (1 hour)", "Rs. 999"),
    ("Drafting / vetting up to 3 pages", "Rs. 999"),
    ("Drafting / vetting over 3-10 pages", "Rs. 4,999"),
    ("Drafting / vetting over 10 pages", "Rs. 9,999"),
    ("Complete case management (annually)", "Rs. 9,999"),
    ("Complete case management (one time)", "Rs. 49,999"),
    ("Corporate retainer (monthly)", "Rs. 4,999"),
    ("Corporate legal audit (one time)", "Rs. 9,999"),
    ("Property document vetting up to 5 pages", "Rs. 999"),
    ("Property document vetting over 5 pages", "Rs. 4,999"),
    ("Government representation & liaisoning (annual)", "Rs. 9,999"),
    ("EPC / JV / MOU commercial contracts", "0.5% of project cost"),
    ("EPC project compliance monitoring", "1% of project cost"),
    ("Employment & service disputes (annual)", "Rs. 9,999"),
    ("Employment & service disputes (one time)", "Rs. 49,999"),
    ("International dispute resolution", "1% of cost involved"),
    ("IP protection (annual)", "Rs. 9,999"),
    ("Corporate legal training", "Rs. 4,999"),
    ("Arbitration & mediation (annual)", "Rs. 9,999"),
    ("Arbitration & mediation (one time)", "Rs. 49,999"),
    ("Domestic enquiry services", "Rs. 9,999"),
    ("Custom / GST / income tax / EPF / ESI filing", "Rs. 499 per filing"),
    ("Corporate legal audit & risk analysis", "Rs. 9,999"),
    ("Investigation & fact-finding services", "Rs. 9,999"),
    ("Regulatory & environmental approvals", "Rs. 4,999 monthly"),
    ("Criminal / family / property / civil matters (annual)", "Rs. 9,999"),
    ("Criminal / family / property / civil matters (one time)", "Rs. 49,999"),
    ("Factory establishment & labour compliance", "1% of project cost"),
    ("Land verification, acquisition & registration", "0.5% of cost"),
    ("Company registration & MCA compliance", "Rs. 1,999"),
    ("Court representation - district / High Court / tribunals", "Rs. 999"),
    ("Government tender & contract assistance", "0.5% of cost"),
    ("Door-to-door service / per visit", "Rs. 999 + travel"),
    ("Cross-border corporate & commercial law - entity formation, governance, M&A and tax structuring", "Quote after review"),
    ("Global regulatory compliance - GDPR, CCPA, AML and industry certifications", "Quote after review"),
    ("Employment & mobility - global workforce compliance, contracts and immigration", "Quote after review"),
    ("Approval & completion compliance monitoring", "Quote after review"),
    ("Corporate retainer service (monthly)", "Rs. 4,999"),
    ("Cross-border corporate law", "Quote after review"),
]

PRICE_GROUPS = [
    "Consultation", "Consultation", "Consultation", "Consultation",
    "Drafting", "Drafting", "Drafting", "Disputes", "Disputes",
    "Corporate", "Corporate", "Property", "Property", "Government",
    "Projects", "Projects", "Employment", "Employment", "Global", "Global",
    "Corporate", "Disputes", "Disputes", "Employment", "Compliance",
    "Compliance", "Compliance", "Compliance", "Disputes", "Disputes",
    "Projects", "Property", "Corporate", "Government", "Government", "Access",
    "Global", "Compliance", "Employment", "Projects", "Corporate", "Global",
]


def _require_admin(admin_session: str | None) -> None:
    if not admin_session or admin_session not in _admin_sessions:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin login required")


def _normalise_booking(document: dict) -> Booking:
    created_at = document.get("created_at")
    if isinstance(created_at, datetime) and created_at.tzinfo is None:
        document["created_at"] = created_at.replace(tzinfo=timezone.utc)
    return Booking(**document)


async def _ensure_pricing_seeded() -> None:
    if await db.pricing.count_documents({}) > 0:
        return
    documents = [
        {
            "id": f"price-{index:03d}",
            "name": name,
            "fee": fee.replace("Rs. ", "₹"),
            "group": PRICE_GROUPS[index - 1],
            "sort_order": index,
        }
        for index, (name, fee) in enumerate(PRICE_LIST, start=1)
    ]
    await db.pricing.insert_many(documents)


async def _ensure_content_seeded() -> None:
    if await db.site_content.find_one({"id": "site-content"}):
        return
    await db.site_content.insert_one(DEFAULT_CONTENT.copy())


def _pdf_text(value: str) -> str:
    replacements = {"₹": "Rs. ", "–": "-", "—": "-", "’": "'", "“": '"', "”": '"'}
    for old, new in replacements.items():
        value = value.replace(old, new)
    return "".join(character if ord(character) < 128 else "?" for character in value)


def _make_price_list_pdf(items: list[tuple[str, str]]) -> bytes:
    lines = [
        "SpLegalMart Global Legal Services",
        "Transparent & Fair Price List | 2026",
        "UPI: 7992461191@ybl | No hidden charges",
        "",
    ]
    for number, (service, fee) in enumerate(items, start=1):
        wrapped = textwrap.wrap(_pdf_text(service), width=68) or [""]
        lines.append(f"{number:02d}. {wrapped[0]}  [{_pdf_text(fee)}]")
        lines.extend(f"    {continuation}" for continuation in wrapped[1:])
    lines.extend(["", "Travelling and court miscellaneous expenses extra.", "Scope-based quotes are confirmed after reviewing the matter."])

    page_lines = [lines[index:index + 45] for index in range(0, len(lines), 45)]
    objects: list[bytes] = []
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    page_object_numbers = [6 + index * 2 for index in range(len(page_lines))]
    kids = " ".join(f"{number} 0 R" for number in page_object_numbers)
    objects.append(f"<< /Type /Pages /Kids [{kids}] /Count {len(page_lines)} >>".encode())
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    objects.append(b"<< /Producer (SpLegalMart) >>")

    for index, page in enumerate(page_lines):
        content = ["BT", "/F1 17 Tf", "42 748 Td", f"({_pdf_text(page[0])}) Tj", "/F1 9 Tf", "0 -23 Td"]
        for line in page[1:]:
            escaped = _pdf_text(line).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
            content.append(f"0 -14 Td ({escaped}) Tj")
        content.append("ET")
        stream = "\n".join(content).encode("ascii", "replace")
        objects.append(f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream")
        content_number = 5 + index * 2
        objects.append(f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents {content_number} 0 R >>".encode())

    pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for number, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{number} 0 obj\n".encode())
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")
    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode())
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode())
    pdf.extend(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF".encode())
    return bytes(pdf)


@router.post("/bookings", response_model=Booking, status_code=status.HTTP_201_CREATED)
async def create_booking(payload: BookingCreate) -> Booking:
    booking = Booking(**payload.model_dump())
    await db.bookings.insert_one(booking.model_dump())
    return booking


@router.get("/pricing", response_model=list[PriceItem])
async def public_pricing() -> list[PriceItem]:
    await _ensure_pricing_seeded()
    documents = await db.pricing.find().sort("sort_order", 1).to_list(1000)
    return [PriceItem(**document) for document in documents]


@router.get("/content", response_model=SiteContent)
async def public_content() -> SiteContent:
    await _ensure_content_seeded()
    document = await db.site_content.find_one({"id": "site-content"})
    return SiteContent(**document)


@router.get("/price-list.pdf", response_class=Response)
async def download_price_list() -> Response:
    await _ensure_pricing_seeded()
    documents = await db.pricing.find().sort("sort_order", 1).to_list(1000)
    return Response(
        content=_make_price_list_pdf([(document["name"], document["fee"]) for document in documents]),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="splegalmart-price-list.pdf"'},
    )


@router.get("/payment-qr.png", response_class=Response)
async def download_payment_qr() -> Response:
    async with httpx.AsyncClient(timeout=15) as client:
        upstream = await client.get(PAYMENT_QR_URL)
    if not upstream.is_success:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Payment QR is temporarily unavailable")
    return Response(
        content=upstream.content,
        media_type="image/png",
        headers={"Content-Disposition": 'attachment; filename="splegalmart-phonepe-qr.png"'},
    )


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
    await _ensure_pricing_seeded()
    total = await db.bookings.count_documents({})
    new = await db.bookings.count_documents({"status": "new"})
    pricing_count = await db.pricing.count_documents({})
    return AdminOverview(
        total_bookings=total,
        new_bookings=new,
        service_count=_service_count,
        pricing_count=pricing_count,
        content_sections=_content_sections,
    )


@router.get("/admin/bookings", response_model=list[Booking])
async def admin_bookings(admin_session: str | None = Cookie(default=None)) -> list[Booking]:
    _require_admin(admin_session)
    documents = await db.bookings.find().sort("created_at", -1).to_list(1000)
    return [_normalise_booking(document) for document in documents]


@router.patch("/admin/bookings/{id}/status", response_model=Booking)
async def update_booking_status(
    id: str,
    payload: BookingStatusUpdate,
    admin_session: str | None = Cookie(default=None),
) -> Booking:
    _require_admin(admin_session)
    updated = await db.bookings.find_one_and_update(
        {"id": id},
        {"$set": {"status": payload.status}},
        return_document=True,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return _normalise_booking(updated)


@router.patch("/admin/pricing/{id}", response_model=PriceItem)
async def update_price_item(
    id: str,
    payload: PriceItemUpdate,
    admin_session: str | None = Cookie(default=None),
) -> PriceItem:
    _require_admin(admin_session)
    await _ensure_pricing_seeded()
    updated = await db.pricing.find_one_and_update(
        {"id": id},
        {"$set": payload.model_dump()},
        return_document=True,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pricing item not found")
    return PriceItem(**updated)


@router.patch("/admin/content", response_model=SiteContent)
async def update_site_content(
    payload: SiteContentUpdate,
    admin_session: str | None = Cookie(default=None),
) -> SiteContent:
    _require_admin(admin_session)
    await _ensure_content_seeded()
    updated = await db.site_content.find_one_and_update(
        {"id": "site-content"},
        {"$set": payload.model_dump()},
        return_document=True,
    )
    return SiteContent(**updated)