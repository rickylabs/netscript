# Context Pack: Canary 9 README service-readiness repair

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-readiness` |
| Branch | `fix/canary-readme-service-readiness` |
| Current phase | `gate — independent PASS recorded; inventory repair awaiting exact hosted CI` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | docs |

## Current State

Canary 9 production run `33712927776` passed README commands 1–10, then hung 900 seconds on the unbounded health curl. The bounded repair is implemented and focused-green: the README now prints users readiness and a 15-second diagnostic curl; the runner captures the port only after that printed wait; production artifacts retain both cleanup receipts.

## Completed

- Exact main/run/issue re-baseline.
- Architecture/gate selection and `PLAN-EVAL: N/A` recorded before implementation.
- Draft PR #1981 opened from bootstrap commit `09d9d2edf` with milestone/taxonomy and no premature closing keyword.
- Focused tests 22/22, scoped check/lint/fmt, gate/suite listings, workflow YAML, docs carrier, and quality gate pass.
- Full nested E2E tests reach 366 passes; two unrelated executable-fixture tests fail on the NAS `/ephemeral/tmp` noexec mount.

## In Progress

- Coordinator repaired the sole hosted quality failure (`manifest:freshness`) after
  the OS restart; local phase-1 parity passes. Await exact pushed-head CI.

## Next Steps

1. Verify hosted CI after the inventory-only repair; independent product PASS is
   recorded in PR comment `5520440630` (product `8704b0571`, evidence `bdb5de2bd`).
2. Keep #1881/#863/#1712 open until a fresh hosted published-version run passes.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Await `users` explicitly | production incident | endpoint allocation is not readiness |
| Curl max 15s; outer gate 20s | incident bound | actionable failure instead of 900-second hang |
| Do not close issues | #1881 | hosted acceptance remains pending |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.../leaf-1881-readiness/` | new/changed | harness activation and exact gate records |
| `README.md` | changed | explicit users readiness + bounded actionable curl |
| `packages/cli/e2e/**/readme-*` | changed | exact 12-command contract, post-readiness endpoint capture, and regressions |
| `packages/cli/e2e/src/domain/cli-surface.ts` | changed | named command-11 readiness and command-12 curl gate IDs |
| `.github/workflows/e2e-cli-prod.yml` | changed | upload cleanup wrapper and child receipts |
| `.llm/tools/release/release-canary-workflow_test.ts` | changed | pin cleanup artifact paths |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS focused; full-suite baseline red | 22/22 focused; check/lint/fmt PASS; 366/368 full nested with two unrelated noexec fixture failures |
| Fitness | PASS | `quality:gate`; docs carrier fresh |
| Runtime | deferred | fresh hosted published-version run |
| Consumer | PASS | exact 12-command gate listing + fake-runner sequence |

## Open Questions

- Exact-head hosted CI and fresh published-version acceptance remain.

## Drift and Debt

- Drift: Canary 9 exposed a readiness assumption not caught by the initial implementation evaluation; `/ephemeral/tmp` noexec blocks two unrelated browser-fixture tests; Aspire phase-2 parity retains six parallel S9/S13 findings.
- Debt: none planned.

## Commits

- `09d9d2edf` — exact incident re-baseline and bounded plan.
- `8704b0571` — implementation plus focused gate receipts.
