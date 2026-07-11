# Drift

## 2026-07-11 — re-baseline

- Brief expectation: the cut's publish set skips `packages/ai` and likely `packages/plugin-ai-core`.
- Current fact: PR #508 already made `packages/ai` a workspace release member, and `publishWorkspace()` discovers both packages today.
- Adjustment: retain the requested outcome by adding a tested, explicit intended-vs-effective audit and enumerated dry-run evidence. Do not manufacture a redundant hard-coded include list.
- Scope remains tooling-only; `docs/site/**` remains deferred and report-only.
