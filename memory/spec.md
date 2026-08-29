# SpLegalMart Global Legal Services — Living Spec

## Product
Public-facing global legal consultancy website with a premium, trustworthy legal-brand presentation. Visitors can explore expertise, pricing, mission and values, CSR, careers, resources, contact details, and submit a consultation booking.

## Data model
- `Booking`: `id`, `full_name`, `mobile`, `email`, `mode`, `slot`, `issue_description`, optional `document_name`, `status`, `created_at`.
- Admin sessions are httpOnly cookie sessions held in memory for this demo pod.

## Key flows
1. Visitor uses the sticky navigation or hero CTA to jump to services, pricing, or booking.
2. Visitor submits a consultation request; it is persisted in MongoDB and a success toast confirms receipt.
3. `/admin` accepts the demo password and shows booking totals, content/service counts, and the latest booking table.

## Auth and roles
- One demo admin role, password-protected at `/api/admin/login`.
- Demo password is documented in `memory/test_credentials.md`.
- Admin session is an httpOnly cookie; logout revokes it in the current backend process.

## Intentional demo limits
- Payment is guidance-only: UPI and PhonePe instructions are displayed; no payment gateway is connected.
- The booking form stores the selected document filename as a reference; binary document storage is not connected.