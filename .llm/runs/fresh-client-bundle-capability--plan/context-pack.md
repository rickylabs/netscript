# Context Pack: deterministic Fresh client-bundle capability

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fresh-client-bundle-capability--plan` |
| Branch | `test/fresh-client-bundle-capability` |
| Current phase | `impl-eval` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Current State

The plan contract was committed unchanged after the supervisor waived PLAN-EVAL for this test-only
leaf. Implementation and all local non-browser gates are green. PR #1940 is non-draft; provisioned
CI must supply the browser receipt before #1557 can be claimed complete.

## Completed

- Read required skills, harness/doctrine references, and both issues including comments.
- Re-baselined branch exactly to current `origin/main`.
- Proved the locked/cached-only Vite command with an empty npm cache.
- Recorded design, risks, slices, and validation plan.
- Committed/pushed the plan contract as `1e54fa598` and opened non-draft PR #1940.
- Replaced runtime npm Vite resolution with the exact workspace alias under `--frozen
  --cached-only`; the bundle test supplies a new empty npm cache.
- Added direct policy-pair tests and a real-browser cache-miss navigation regression with request,
  exact-one named-boundary swap, and double-swap negative-control evidence.
- Passed Fresh check/lint/fmt, 278 package tests, and `quality:gate`.

## In Progress

- Provisioned CI browser receipt and independent IMPL-EVAL.

## Next Steps

1. Commit implementation and updated run receipts; explicit-refspec push.
2. Confirm the provisioned Fresh browser CI receipt.
3. Obtain a separate-session IMPL-EVAL verdict and reconcile PR #1940.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Package-level browser test | plan D1 | Existing capability observes client navigation; CLI E2E does not. |
| Real Playwright driver | plan design note | Hydrated effect/form submission cannot be simulated honestly by server fetch. |
| Locked/cached-only Vite | plan D2 | Exact package import and root lock already exist. |
| Existing opt-in browser lane | plan D5 | No workflow/image/dependency addition. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fresh-client-bundle-capability--plan/*` | updated | Plan contract plus implementation/gate receipts. |
| `packages/fresh/**` | changed | Test-only locked Vite and client-navigation capability. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | 213 files check/lint/fmt; check used `--unstable-kv` |
| Fitness | PASS locally | 278 tests plus `quality:gate`; PLAN-EVAL supervisor-waived |
| Runtime | blocked locally/pending CI | `playwright-cli` absent locally; existing CI provisions it |
| Consumer | N/A | No public-surface change |

## Open Questions

- None. Remaining work is verdict collection, not design.

## Drift and Debt

- Drift: #1557's original missing-capability premise is superseded; local driver is absent.
- Debt: none created or deepened.

## Commits

- Plan: `1e54fa598b7a58d9a2155d2fb162653c646d25bf`.
- Implementation: `e912c414d2da72711e36bbb5daa1d933c3c19d8b`.
