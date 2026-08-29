"""Covers: 'Pricing and downloads remain functional' (catalogue size, PDF + QR downloads)."""


def test_pricing_catalogue_has_42_entries_and_is_categorised(client):
    resp = client.get("/pricing")
    assert resp.status_code == 200, resp.text
    items = resp.json()
    assert len(items) == 42
    assert all("group" in item and "fee" in item and "name" in item for item in items)
    groups = {item["group"] for item in items}
    assert "Property" in groups


def test_price_list_pdf_download_returns_valid_pdf(client):
    resp = client.get("/price-list.pdf")
    assert resp.status_code == 200, resp.text
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content[:5] == b"%PDF-"
    assert "attachment" in resp.headers.get("content-disposition", "")
    assert len(resp.content) > 500


def test_payment_qr_download_returns_image(client):
    resp = client.get("/payment-qr.png")
    assert resp.status_code == 200, resp.text
    assert resp.headers["content-type"] == "image/png"
    assert "attachment" in resp.headers.get("content-disposition", "")
    assert len(resp.content) > 100
