# SpLegalMart Global Legal Services — Living Spec

## Product
Public-facing global legal consultancy website with a premium, trustworthy legal-brand presentation. Visitors can explore expertise, pricing, mission and values, CSR, careers, resources, contact details, and submit a consultation booking.

The public catalogue contains 42 service and pricing entries, including fixed-fee items, percentage-based project fees, and scope-based quotes for global services where the brief did not specify a fixed amount. Visitors can filter by category, send a prefilled quote request, and download a branded PDF price list. Admins can update service names, fees, and categories; the public catalogue and generated PDF use the same MongoDB data.

## Data model
- `Booking`: `id`, `full_name`, `mobile`, `email`, `mode`, `slot`, `issue_description`, optional `document_name`, `status`, `created_at`.
- Admin sessions are httpOnly cookie sessions held in memory for this demo pod.

## Key flows
1. Visitor uses the sticky navigation or hero CTA to jump to services, pricing, or booking.
2. Visitor submits a consultation request; it is persisted in MongoDB and a success toast confirms receipt.
3. `/admin` accepts the demo password and shows booking totals, content/service counts, and the latest booking table.
4. Admins can progress bookings through New, Contacted, Paid, Completed, and Closed states.
5. Admins can edit pricing and core About/Mission/Vision/Values/Contact content; public queries fall back to bundled defaults if the backend is unavailable.
6. Visitors can search legal guides, read expanded guidance, and download the supplied PhonePe QR.

## Auth and roles
- One demo admin role, password-protected at `/api/admin/login`.
- Demo password is documented in `memory/test_credentials.md`.
- Admin session is an httpOnly cookie; logout revokes it in the current backend process.

## Intentional demo limits
- Payment is guidance-only: UPI and the supplied PhonePe QR are displayed; no payment gateway is connected.
- The booking form stores the selected document filename as a reference; binary document storage is not connected.