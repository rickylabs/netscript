# Drift — #1117

## 2026-08-05 — canary base classifier

- Severity: procedural
- Hosted e2e visibility reported `unsupported base and no opt-in label` for the PR targeting
  `canary/0.0.5-canary.13`, so substantive scaffold contexts were policy-skipped.
- Response: classified the result as did-not-run, applied the explicit `ci:full` escape hatch, and
  pushed this record after labeling so the new run observes live opt-in state.
- Product design and implementation scope are unchanged.
