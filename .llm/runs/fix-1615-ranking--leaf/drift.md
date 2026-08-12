# Drift Log: deterministic guidance ranking

Drift is append-only.

## 2026-08-12 — owner-selected evaluator fallback

- **What:** The milestone prohibits Fable and assigns native Opus 5 as a read-only evaluator
  fallback dispatched by the orchestrator per immutable head.
- **Source:** User implementation brief for PR-H / #1615.
- **Expected:** `lane-policy.md` normally pairs Codex Sol high implementation with Fable medium.
- **Actual:** Owner-authorized native Opus 5 separate-session fallback; no paid retrigger or label
  cycle is permitted.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` route table and owner directive.

## 2026-08-12 — fresh head moves more than the abbreviated issue table

- **What:** Re-derived ranking over sibling PR #1608 head puts the plugin explainer second and the
  direct-ownership section fourth, while the issue summarizes the observed change as a third-rank
  replacement.
- **Source:** In-memory measurement over
  `9e9a9b6f6:packages/mcp/src/publish-assets.generated.ts`, cross-checked against
  `GuidanceIndex.find()`.
- **Expected:** decision-rule → unsupported example → plugin explainer, per issue table.
- **Actual:** decision-rule → plugin explainer → unsupported example → direct ownership. The two
  named candidates are separated by only `0.3019801981861221` and the implementation decision is
  unchanged.
- **Severity:** minor
- **Action:** accept and test the complete live fresh order; do not rewrite the issue history.
- **Evidence:** score measurement in `research.md` and `worklog.md`.
