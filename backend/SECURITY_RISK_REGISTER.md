# Security & Dependency Risk Register

Purpose: Track known security and operational risks with current mitigation status for SIH readiness.

## Legend
- Status: OPEN | MITIGATED | ACCEPTED | TRANSFERRED
- Severity: CRITICAL | HIGH | MEDIUM | LOW | INFO

## 1. Dependency Risks
| ID | Package / Component | Issue Type | Severity | Status | Notes / Mitigation |
|----|---------------------|------------|----------|--------|--------------------|
| DEP-1 | web3 (transitives: ws, form-data) | Known historic vulns in ws/form-data older ranges | MEDIUM | ACCEPTED | Upgrading breaks Hardhat compatibility; monitored, runtime exposure limited to internal RPC client. |
| DEP-2 | ipfs-http-client | Large dependency surface | MEDIUM | ACCEPTED | Feature currently mock-level only; restrict usage to controlled code paths; can tree-shake if removed before prod. |
| DEP-3 | multer (file upload) | DoS via large files | MEDIUM | MITIGATED | File size capped at 10MB; consider content-type sniffing & AV scan phase. |
| DEP-4 | bcrypt | Native build risk on some platforms | LOW | ACCEPTED | Locked to maintained major; monitor advisories. |
| DEP-5 | express-rate-limit | Potential misconfiguration (bypass) | LOW | MITIGATED | Tiered configs; review per-route application. |

## 2. Application Risks
| ID | Area | Risk | Severity | Status | Mitigation / Plan |
|----|------|------|----------|--------|-------------------|
| APP-1 | Auth | JWT secret misuse / weak default | HIGH | MITIGATED | Strong env variable required in deployment; dev fallback flagged in docs. |
| APP-2 | CSRF | Token reuse beyond window (15m) | LOW | ACCEPTED | Time-slice approach; can tighten to 5m if needed. |
| APP-3 | 2FA | Secrets not persisted | MEDIUM | OPEN | Currently stateless; persistence + encryption planned. |
| APP-4 | Audit Logs | Only console/pino output | MEDIUM | OPEN | Plan to persist to Mongo or external SIEM. |
| APP-5 | File Upload | No malware scanning | MEDIUM | OPEN | Add ClamAV sidecar or SaaS scan pre-storage. |
| APP-6 | Blockchain | Mock fallback may hide integration failures | MEDIUM | OPEN | Add health check comparing mock vs real mode & contract event sync. |
| APP-7 | Geo Verification | Spoof detection absent | MEDIUM | OPEN | Implement speed/distance anomaly detection (planned). |
| APP-8 | CSP | 'unsafe-inline' allowed | HIGH | OPEN | Remove after refactoring frontend inline resources. |
| APP-9 | Secrets | Centralized secret management missing | MEDIUM | OPEN | Integrate Vault / SSM for prod. |

## 3. Infrastructure / Ops
| ID | Area | Risk | Severity | Status | Mitigation / Plan |
|----|------|------|----------|--------|-------------------|
| OPS-1 | Scaling | No horizontal auto-scaling mechanism | MEDIUM | OPEN | Containerize + add HPA or KEDA later. |
| OPS-2 | Caching | No Redis layer for hotspots | LOW | OPEN | Evaluate read patterns post-MVP. |
| OPS-3 | Monitoring | Limited metrics scope | MEDIUM | OPEN | Expand Prometheus metrics (auth failures, 2FA attempts). |
| OPS-4 | Backups | Mongo backup strategy undefined | HIGH | OPEN | Add scheduled dump + retention policy. |

## 4. Roadmap Actions
Planned next (ordered): APP-8 (CSP hardening), APP-3 (2FA persistence), APP-4 (audit DB), APP-7 (geo spoof), OPS-4 (backups), APP-6 (blockchain real-mode health).

---
Generated: UTC 