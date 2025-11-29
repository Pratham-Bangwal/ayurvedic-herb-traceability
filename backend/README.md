# Backend API

Express.js REST API for herb traceability integrating with blockchain smart contracts.

## Key Security Features

| Feature | Description | Env / Notes |
|---------|-------------|-------------|
| Rate Limiting | Tiered: auth (strict), sensitive (very strict), general API | Configured in `middleware/rateLimiter.js` |
| Helmet Hardening | CSP, HSTS (30d), Referrer-Policy, Permissions-Policy | Adjust CSP once inline scripts removed |
| CSRF Protection | Stateless HMAC token (`/api/auth/csrf-token`); enforced for mutating verbs | Disable via `CSRF_DISABLE=1` or tests auto-skip |
| Auth | JWT (8h expiry) + role claims (`authService.js`) | `JWT_SECRET` required in production |
| 2FA (TOTP) | Opt-in TOTP generation & verification endpoints | `/api/auth/2fa/setup`, `/api/auth/2fa/verify` |
| Analytics Export | CSV download of herb distribution | `/api/analytics/herb-distribution.csv` (auth) |
| Geo Anomaly Detection | Heuristic speed/distance detection (logs events) | Utility `geoAnomaly.js` |
| Account Lockout | Locks after 5 failed attempts | In-memory (stateless) demo only |
| Audit / Security Events | Structured pino logs (`security_event`) | See `utils/securityEvents.js` |
| Input Validation | Zod schemas for create/process/transfer | `middleware/validation.js` |
| Request Correlation | `X-Request-Id` per request | Added early in pipeline |

## CSRF Flow
1. Client GET `/api/auth/csrf-token` → receive JSON `{ data: { csrf } }` and header `X-CSRF-Token`.
2. Include that value as `X-CSRF-Token` header on POST/PUT/PATCH/DELETE.
3. Token valid for 15‑minute time slices; automatic previous-slice grace.
4. Skip in automated tests (`NODE_ENV=test`) unless `CSRF_ENFORCE_IN_TEST=1`.

## Audit Event Types
- `auth.login.success`
- `auth.login.failure`
- `auth.login.lockout`
- `auth.user.create`

Filter logs: `grep security_event` or configure pino transport.

## Hardening Roadmap (Planned)
- 2FA (TOTP) optional user field
	- Basic endpoints implemented (stateless demo); persistence integration pending
- Persistent audit sink (Mongo/ELK)
- Remove `'unsafe-inline'` from CSP
- Add Redis caching + token revocation list
- Geo spoof detection enhancements
- Blockchain real integration health & contract event sync
- CSV export (basic done) -> add filtering & pagination controls
## Risk Register
See `SECURITY_RISK_REGISTER.md` for tracked dependency & application risks.

## Scripts
- `npm run dev` start development server with nodemon
- `npm test` run tests

## Environment Variables (Partial)
| Name | Purpose | Default |
|------|---------|---------|
| `JWT_SECRET` | JWT signing secret | dev fallback (override!) |
| `CSRF_SECRET` | HMAC base for CSRF tokens | Falls back to JWT secret or dev secret |
| `CSRF_DISABLE` | Disable CSRF middleware entirely | unset |
| `CSRF_ENFORCE_IN_TEST` | Force CSRF checks in tests | unset |
| `AUTH_DEV_MODE` | Auto-inject farmer role when auth required | unset |

---

Keep this README aligned with new security controls when added.
