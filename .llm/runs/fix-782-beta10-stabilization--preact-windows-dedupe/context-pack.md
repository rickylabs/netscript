# Context Pack: fix #782 — Preact Windows dedupe

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-782-beta10-stabilization--preact-windows-dedupe` |
| Branch | `fix/782-beta10-stabilization` |
| Current phase | `plan` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Current State

Issue #782 is current and reproducible at the `@netscript/fresh/vite` resolver boundary. The branch
and remote PR base both start at `0daa575b`. Existing Vite tests pass, but the NetScript resolver
does not delegate Preact imports, so Windows backslash IDs are not canonicalized. Architecture and
the one implementation slice are locked; no framework code has changed yet.

## Completed

- Read requested skills, harness activation/run-loop/lane policy, Archetype 4 profile, frontend
  overlay, relevant doctrine, debt, and templates.
- Read issue #782 and all comments through the required GitHub token resolver/API.
- Read the linked consumer proof in eis-chat PR #150.
- Ran `deno doc` before broad Fresh source reads and `deno task deps:why vite`.
- Reproduced the missing delegated normalization before implementation.
- Recorded research, plan, Design checkpoint, and evaluator ownership.

## In Progress

- S0 plan bootstrap commit, explicit push, and draft PR creation.

## Next Steps

1. Commit/push S0 and open the required draft PR against `feat/beta10-integration`.
2. Add the production module-identity regression and record its pre-fix failure.
3. Implement Preact dedupe plus delegated ID canonicalization and docs.
4. Run the complete planned gate set and update run evidence.
5. Commit/push S1, post evidence, and hand off at `status:impl-eval`.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Preact-only resolver policy | issue #782 + plan D1 | Avoids unsafe generalization. |
| Delegate then normalize `id` | consumer PR #150 + plan D2/D3 | Preserves normal Vite behavior and metadata. |
| Production build fixture | issue acceptance + plan D6 | Cross-platform controlled slash-variant graph. |
| No evaluator dispatch | owner directive | Supervisor owns both passes. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-782-beta10-stabilization--preact-windows-dedupe/` | new | Harness bootstrap, research, plan, design, context, drift. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | baseline PASS | Existing Vite test: 7/7. |
| Fitness | planned | quality/architecture gates deferred to S1. |
| Runtime | expected pre-fix FAIL reproduced | Resolver returned null and never delegated Preact. |
| Consumer | baseline PASS | Existing alias test and merged external workaround. |

## Open Questions

- None that block implementation. Native Windows browser evidence may be added by supervisor/CI.

## Drift and Debt

- Drift: evaluator dispatch and daemon attachment are explicitly supervisor-owned/unclaimed.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments after S0 opens it.

