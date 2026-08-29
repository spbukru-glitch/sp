"""Covers: 'Admin booking statuses are manageable'."""

import uuid

ADMIN_PASSWORD = "admin123"


def _login(client):
    resp = client.post("/admin/login", json={"password": ADMIN_PASSWORD})
    assert resp.status_code == 200, resp.text
    assert resp.json()["authenticated"] is True


def _create_booking(client) -> str:
    mobile = f"7{uuid.uuid4().int % 10**9:09d}"
    payload = {
        "full_name": f"tscheck-admin-status-{uuid.uuid4().hex[:8]}",
        "mobile": mobile,
        "email": "tscheck-admin-status@example.com",
        "mode": "Office visit",
        "slot": "Wed, 11:00 AM",
        "issue_description": "tscheck fixture: dispute over a lease agreement needs review.",
    }
    resp = client.post("/bookings", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def test_admin_can_transition_booking_through_statuses(client):
    _login(client)
    booking_id = _create_booking(client)

    for status_value in ["contacted", "paid", "completed", "closed"]:
        resp = client.patch(f"/admin/bookings/{booking_id}/status", json={"status": status_value})
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == status_value

    listing = client.get("/admin/bookings")
    assert listing.status_code == 200
    row = next(b for b in listing.json() if b["id"] == booking_id)
    assert row["status"] == "closed"


def test_admin_endpoints_require_authentication(client):
    resp = client.get("/admin/bookings")
    assert resp.status_code == 401
