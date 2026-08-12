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
- **Source:** In-memory measurement over `9e9a9b6f6:packages/mcp/src/publish-assets.generated.ts`,
  cross-checked against `GuidanceIndex.find()`.
- **Expected:** decision-rule → unsupported example → plugin explainer, per issue table.
- **Actual:** decision-rule → plugin explainer → unsupported example → direct ownership. The two
  named candidates are separated by only `0.3019801981861221` and the implementation decision is
  unchanged.
- **Severity:** minor
- **Action:** accept and test the complete live fresh order; do not rewrite the issue history.
- **Evidence:** score measurement in `research.md` and `worklog.md`.

## 2026-08-12 — root test retains the dispatched-base #1589 failure

- **What:** The full repository test gate exits non-zero on one published-JSDoc codename finding.
- **Source:** `rtk proxy deno task test` at this branch head.
- **Expected:** The implementation brief identifies the same dispatched-base failure as
  pre-existing, owned by #1612 and fixed in PR #1614.
- **Actual:** 3321 tests passed, 17 were ignored, and the sole failure names
  `packages/cli/src/kernel/domain/dependency-closures/netscript-web-runtime-closure.ts:6 #1589`;
  guidance evaluation passed in the same run.
- **Severity:** minor
- **Action:** accept; do not pull unrelated PR #1614 scope into this leaf.
- **Evidence:** full-suite aggregate and failure diagnostic in `worklog.md`.

## 2026-08-12 — scoped wrappers need the package config explicitly

- **What:** Implicit config discovery for the lint/fmt wrappers rejects the root workspace wildcard
  with Deno 2.9.5 before analyzing files.
- **Source:** Required scoped wrapper invocations for `packages/mcp`.
- **Expected:** The brief's abbreviated commands omit `--config`.
- **Actual:** Adding `--config packages/mcp/deno.json` routes the same 115-file scope correctly;
  lint and format then exit 0 with no findings. Check succeeds without the explicit config.
- **Severity:** minor
- **Action:** accept for this leaf; use the package config as supported wrapper input rather than
  changing repository tooling outside #1615.
- **Evidence:** final wrapper results in `worklog.md`.

## 2026-08-12 — confidence semantics corrected after review

- **What:** S1 computed confidence from the global maximum before route and close-score ordering,
  while prior behavior used the score of the post-order winner.
- **Source:** Review of head `543a7b1e9` against `routeIndex()` semantics.
- **Expected:** Route hints promote a candidate and that agent-facing winner determines confidence.
- **Actual:** The pre-review implementation could report a higher confidence from an unreturned
  global scorer.
- **Severity:** significant
- **Action:** fixed by moving `ranked[0]?.score` after ordering and adding a public-behavior test
  with a high global scorer and medium route-promoted winner.
- **Evidence:** S3 gate rows in `worklog.md`.

## 2026-08-12 — deterministic tie-break is not insertion-stable

- **What:** Slug ordering is a deterministic but arbitrary total order for statistically tied
  cross-document candidates.
- **Source:** Review question about adding a third close-scoring document.
- **Expected:** Existing candidate order does not flip under unrelated corpus-statistic drift.
- **Actual:** A newly added candidate inside the leader-anchored `0.5` group can sort before both
  existing candidates and legitimately change the locked rank.
- **Severity:** minor
- **Action:** accept and disclose. This fixture protects repeatability for a fixed candidate set;
  corpus growth that adds a genuinely close candidate requires semantic review, not automatic golden
  regeneration.
- **Evidence:** grouping design and focused boundary test.

## 2026-08-12 — superseding the earlier scoped-format claim

- **What:** The earlier drift entry treated explicit package config as enough for a scoped format
  verdict.
- **Source:** Follow-up review and issue #1618.
- **Expected:** A package-wide format command can inspect every selected source safely.
- **Actual:** The deliberately malformed `packages/mcp/tests/fixtures/doctor/broken/deno.json`
  prevents a trustworthy package-scoped formatter verdict; this is pre-existing on `origin/main`.
- **Severity:** minor
- **Action:** supersede the earlier format PASS claim, leave #1618 untouched, and use exact
  touched-file `deno fmt --check` evidence for #1615.
- **Evidence:** S3 exact-file format row in `worklog.md`.
