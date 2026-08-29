"""Covers: 'Admin content and media manager works'."""

import uuid

ADMIN_PASSWORD = "admin123"


def _login(client):
    resp = client.post("/admin/login", json={"password": ADMIN_PASSWORD})
    assert resp.status_code == 200, resp.text


def test_admin_updates_content_and_media_reflect_on_public_endpoint(client):
    _login(client)

    original = client.get("/content")
    assert original.status_code == 200
    payload = original.json()

    marker = f"tscheck-content-{uuid.uuid4().hex[:8]}"
    payload["about"] = f"{marker} about text describing the firm."
    payload["leader_name"] = f"{marker} Leader"
    payload["leader_title"] = f"{marker} Title"
    payload["hero_image"] = "https://customer-assets-0z36b82j.emergentagent.net/tscheck-hero.png"

    updated = client.patch("/admin/content", json=payload)
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert body["about"] == payload["about"]
    assert body["leader_name"] == payload["leader_name"]
    assert body["hero_image"] == payload["hero_image"]

    public = client.get("/content")
    assert public.status_code == 200
    public_body = public.json()
    assert public_body["about"] == payload["about"]
    assert public_body["leader_name"] == payload["leader_name"]
    assert public_body["hero_image"] == payload["hero_image"]

    # restore original content so we don't leave the seeded record mutated for other tests
    restore = client.patch("/admin/content", json=original.json())
    assert restore.status_code == 200


def test_admin_content_update_requires_authentication(client):
    current = client.get("/content").json()
    resp = client.patch("/admin/content", json=current)
    assert resp.status_code == 401
