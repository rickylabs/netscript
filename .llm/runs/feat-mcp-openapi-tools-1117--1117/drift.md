# Drift — #1117

## 2026-08-05 — canary base classifier

- Severity: procedural
- Hosted e2e visibility reported `unsupported base and no opt-in label` for the PR targeting
  `canary/0.0.5-canary.13`, so substantive scaffold contexts were policy-skipped.
- Response: classified the result as did-not-run. The canary.13 workflow source shows that
  `ci:full` forces lanes only after scheduling, while unsupported bases require `e2e-cli-gate` at
  the applicability gate. Applied both labels and pushed this corrected record afterward so the new
  run observes live opt-in state and executes all lanes.
- Product design and implementation scope are unchanged.
