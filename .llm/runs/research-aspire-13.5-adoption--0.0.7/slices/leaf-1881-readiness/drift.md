# Drift Log: Canary 9 README service-readiness repair

## 2026-09-03 — Endpoint allocation was mistaken for service readiness

- **What:** The README walker captured the users endpoint immediately after waiting only for Postgres, then treated the port as ready for a health request.
- **Source:** Canary 9 production run `33712927776`, README command 11 receipt.
- **Expected:** The printed quickstart reaches a responsive users health endpoint without undocumented steps.
- **Actual:** `curl http://localhost:32923/health` made no progress for 900 seconds and exited 143.
- **Severity:** significant
- **Action:** fix
- **Evidence:** https://github.com/rickylabs/netscript/actions/runs/33712927776

