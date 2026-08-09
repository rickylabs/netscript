# Drift log: W3-B3 #1376

## 2026-08-09 — slice path corrected after PLAN-EVAL

- Severity: minor/process correction.
- Expected: assigned canonical directory
  `.llm/runs/release-0.0.5--orchestration/slices/w3-b3-1376/`.
- Observed: S0 mistakenly created `slices/w3-b-1376/` and incorrectly described the assigned path
  as absent.
- Action: consolidated all artifacts on canonical `w3-b3-1376`; the earlier absence claim is
  withdrawn. No product or scope change.

## 2026-08-09 — publish-version authority corrected

- Severity: significant planning correction; PLAN-EVAL F1.
- Planned claim: publish-assets generation asserted CLI/MCP version equality.
- Observed: it reads and emits each manifest independently. Current equality comes from coordinated
  workspace bump and release-readiness residue checks.
- Action: locked explicit standalone decoupling. Standalone MCP owns its
  `MCP_PACKAGE_VERSION`-selected CLI compatibility pin and exposes it to the agent; no false
  equality assertion or generator scope is added.
