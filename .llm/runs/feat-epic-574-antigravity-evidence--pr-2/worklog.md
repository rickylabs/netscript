# Worklog: Antigravity evidence-acquisition lane (#578)

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-epic-574-antigravity-evidence--pr-2` |
| Branch | `feat/epic-574-antigravity-evidence` |
| Archetype | 6 — CLI / Tooling, scoped internal-tool variant |
| Scope overlays | none |

## Design

### Public Surface

- Internal-only `AntigravityEvidenceRequest`, `AntigravityEvidence`, and
  `AntigravityEvidenceResult`; existing controller public result remains canonical.
- Pure `classifyAntigravityEvidence()` plus injected `AntigravityEvidenceAdapter.run()`.
- Existing `planAntigravityCommand()` retains issue-578 live deferral until the S4 live gate passes.

### Domain Vocabulary

- Capability status: `supported | unsupported | unknown | deferred`.
- Evidence status: `passed | blocked | failed | deferred`.
- Failure signal: authentication, provider unavailable, timeout, quota, rate limit, malformed, or
  unsupported.
- Citation metadata is normalized URL/count evidence, never provider body text.

### Ports

- Bounded child-process seam — makes `agy` execution synthetic-testable and keeps `Deno.Command` at
  the adapter edge.
- Conditional resource-aggregation handoff — receives normalized citation metadata only after a
  positive web/citation gate; it is not invoked for current blocked evidence.

### Constants

- `ANTIGRAVITY_CAPABILITIES` — finite keys named in `plan.md`.
- `ANTIGRAVITY_EVIDENCE_STATUSES` / `ANTIGRAVITY_FAILURE_SIGNALS` — exhaustive result axes.
- `ANTIGRAVITY_CANARY_TIMEOUT_MS` / `ANTIGRAVITY_MAX_CAPTURE_BYTES` — bounded execution policy.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| S0 | Research, classified evidence, plan, Design, and hard live gate. | Plan-Gate; diff/secret scan. | run artifacts only |
| S1 | Finite contract and pure classifier. | Focused tests; scoped wrappers. | evidence contract + test + run artifacts |
| S2 | Bounded adapter and failure classification. | Synthetic adapter matrix; scoped wrappers. | adapter + tests + run artifacts |
| S3 | Citation/instruction/legacy-state classification and conditional aggregation. | Semantic fixtures; boundary tests. | focused runtime files/tests/docs + run artifacts |
| S4 | Minimal live acceptance and conditional planner unblock. | Classified live matrix; full owned gates. | evidence/planner/tests/docs + run artifacts |

### Deferred Scope

- Current live enablement is deferred pending owner-confirmed Google Sign-In readiness.
- #579 fallback/quota state, #580 sender/daemon, #581 routing, and #582 rollout remain blocked.

### Contributor Path

Extend the finite capability constants and pure synthetic fixtures first. Add a live assertion only
after it is bounded and secret-safe; connect planner/aggregation only after positive evidence.

## Progress Log

| Date | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-10 | S0 | Pre-flight | HEAD descends from `800848ae`; #577 profile file present; scoped fetch used after stale refspec failure. |
| 2026-07-10 | S0 | Research | Static flags classified; one initial capture failure and one exit-1 auth/service timeout retry; further live calls stopped. |
| 2026-07-10 | S0 | Design | Negative evidence drives fail-closed adapter plan; no implementation started. |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Plain fetch targets deleted branch. | minor | yes |
| Live session not ready despite existing `~/.gemini`. | significant | yes |
| First live classifier record was not returned by orchestration. | minor | yes |

## Gate Results

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| Plan-Gate | NOT_RUN | Coordinator owns Plan-Gate after S0 push/comment. |
| Implementation gates | NOT_RUN | Hard stop; no adapter implementation. |
| Artifact syntax/diff | PASS | Evidence JSON parsed; `git diff --cached --check` exit 0. |
| Secret/PII safety | PASS | Staged-diff credential-value scan found no matches; machine evidence contains classifications only. |

## Handoff Notes

- Inspect the machine evidence and L11/live integration gate first.
- A Plan-Gate approval does not fabricate external readiness; resume the same thread only after the
  owner verifies Google Sign-In outside automation.
