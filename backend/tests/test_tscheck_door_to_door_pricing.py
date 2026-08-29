"""Covers: 'Door-to-door pricing is prominent' - pricing catalogue retains the Door-to-door entry at Rs999 + travel."""


def test_pricing_catalogue_contains_door_to_door_entry_at_999_plus_travel(client):
    resp = client.get("/pricing")
    assert resp.status_code == 200, resp.text
    items = resp.json()
    assert len(items) == 42
    door_to_door = [item for item in items if "door-to-door" in item["name"].lower()]
    assert len(door_to_door) >= 1, f"No door-to-door entry found in {items}"
    entry = door_to_door[0]
    assert "999" in entry["fee"], entry
    assert "travel" in entry["fee"].lower(), entry
