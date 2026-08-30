# Drift Log: Aspire 13.5 S5 literal ports

## 2026-08-30 — Infrastructure-port decision label

- **What:** The owner directive calls infrastructure host-port randomization D-16, while the parent
  plan uses D-16 for archival scope and records the port collision under S2 V3/OF-3a context.
- **Source:** Owner prompt; parent `plan.md`; issue #1717 S2 V3 comment.
- **Expected:** One stable decision identifier.
- **Actual:** The behavior and evidence are unambiguous despite the label mismatch.
- **Severity:** minor
- **Action:** accept
- **Evidence:** S2 `02-capture-db-allocation-*.raw.txt`, `02-verify-live-db-endpoint.raw.txt`, and
  `02-aspire-describe-*.json` on `origin/test/aspire-13-5-s2-runtime-verification`.
