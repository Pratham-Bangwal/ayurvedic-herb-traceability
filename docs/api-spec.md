# API Spec (Updated Summary)

All successful JSON responses are wrapped: `{ "data": ... }`.
Error responses: `{ "error": { "code", "message" } }`.

Headers:
- `X-Request-Id`: per request correlation ID.
- Deprecated routes emit: `Deprecation: true`, `Warning: 299 ...`, `Link: <canonical>`.

Validation (enforced server-side via Zod):
- `batchId`, `name` required for create.
- Geo: `lat` ∈ [-90,90], `lng` ∈ [-180,180].
- `newOwner`: pattern `^0x[a-fA-F0-9]{3,}$` (placeholder for full address).

Security (future): `bearerAuth` placeholder defined in OpenAPI; not yet required.

## Endpoints
### GET /api/herbs
List herbs. 200 -> `{ data: Herb[] }`.

### POST /api/herbs
Create herb (JSON). 201 -> `{ data: Herb }`.

### POST /api/herbs/create (deprecated)
Legacy create; same body/response; includes deprecation headers.

### POST /api/herbs/upload
Multipart: fields (name, batchId, lat?, lng?, harvestedAt?, photo?). 201 -> `{ data: Herb }`.

### POST /api/herbs/:batchId/process
Body `{ actor, data }`. 200 -> updated `{ data: Herb }`.

### POST /api/herbs/:batchId/events (deprecated)
Legacy equivalent of process; deprecation headers.

### POST /api/herbs/:batchId/transfer
Body `{ newOwner }`. 200 -> `{ data: Herb }` (ownershipTransfers appended).

### GET /api/herbs/:batchId/trace
Full public trace `{ data: Trace }`.

### GET /api/herbs/:batchId/qrcode
SVG (not JSON) of QR referencing frontend trace URL.

### POST /api/herbs/validate-image
Multipart `{ batchId, photo }`. 200 -> `{ data: AIValidation }`.

### GET /healthz
Plain text/200 health check.

### GET /metrics
Prometheus text (placeholder: single counter). Future: request totals, latency, errors.

---

Schema fields (selected):
- Herb.processingEvents: `[ { actor, data, timestamp } ]`.
- Herb.ownershipTransfers: `[ { to, timestamp } ]`.
- Herb.chain: object (mock or future tx metadata).
- Trace: adds `traceUrl`, `qr` (data URI).

---

Error Codes (examples):
- validation_error (400)
- not_found (404)
- internal_error (500)
- photo_required (400)

---

Future Additions:
- Auth header + role claims.
- Pagination for GET /api/herbs.
- Enhanced metrics (histograms, gauges).
- Detailed blockchain transaction fields.
