"""Covers: 'Booking creates a trackable reference' and 'Client tracking is private and accurate'."""

import uuid


def _booking_payload(mobile: str) -> dict:
    return {
        "full_name": f"tscheck-booking-{uuid.uuid4().hex[:8]}",
        "mobile": mobile,
        "email": "tscheck-booking@example.com",
        "mode": "Online video / audio call",
        "slot": "Tue, 4:00 PM",
        "issue_description": "tscheck fixture: need help drafting a rental agreement.",
    }


def test_booking_create_returns_uuid_reference(client):
    mobile = f"9{uuid.uuid4().int % 10**9:09d}"
    resp = client.post("/bookings", json=_booking_payload(mobile))
    assert resp.status_code == 201, resp.text
    body = resp.json()
    # id should parse as a valid UUID
    parsed = uuid.UUID(body["id"])
    assert str(parsed) == body["id"]
    assert body["status"] == "new"
    assert body["mobile"] == mobile


def test_tracking_correct_mobile_returns_status_and_wrong_mobile_rejected(client):
    mobile = f"8{uuid.uuid4().int % 10**9:09d}"
    created = client.post("/bookings", json=_booking_payload(mobile)).json()
    booking_id = created["id"]

    ok = client.post("/bookings/track", json={"id": booking_id, "mobile": mobile})
    assert ok.status_code == 200, ok.text
    ok_body = ok.json()
    assert ok_body["id"] == booking_id
    assert ok_body["status"] == "new"
    assert ok_body["mode"] == created["mode"]
    assert ok_body["slot"] == created["slot"]

    wrong = client.post("/bookings/track", json={"id": booking_id, "mobile": "0000000000"})
    assert wrong.status_code == 404, wrong.text
