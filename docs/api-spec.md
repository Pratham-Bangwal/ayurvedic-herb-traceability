# API Spec (Initial Draft)

## GET /api/herbs
List herbs.

## POST /api/herbs
Create a herb batch.
## POST /api/herbs/upload (multipart)
Fields: name, batchId, lat, lng, harvestedAt?, photo (file)

## POST /api/herbs/:batchId/process
Add processing event { stage, notes?, actor? }

## POST /api/herbs/:batchId/transfer
Body: { newOwner }

## GET /api/herbs/:batchId/trace
Detailed trace (similar to /api/trace alias)

## GET /api/trace/:batchId
Public condensed trace.

## GET /api/herbs/:batchId/qrcode
SVG QR referencing trace URL.

## POST /api/herbs/validate/image (multipart)
Fields: batchId, photo
Returns AI validation stub payload.

## GET /healthz
Service health.
Body:
```
{
  "name": "Ashwagandha",
  "batchId": "BATCH-001",
  "originFarm": "Farm A",
  "harvestedAt": "2024-10-01T00:00:00Z",
  "qualityScore": 90
}
```
