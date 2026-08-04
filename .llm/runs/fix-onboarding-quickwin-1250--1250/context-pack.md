# Context Pack: restore Zod-4 OpenAPI query coercion (#1250)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-onboarding-quickwin-1250--1250` |
| Branch | `fix/onboarding-quickwin-1250` |
| Current phase | `gate` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `service` |

## Current State

The Zod-4 coercion adapter and the docs-shaped HTTP regression are green. All locally required
targeted gates pass; the slice is ready to commit, push, comment, and hand to composed evaluation.

## Completed

- Read issue body, relevant skills, harness authorities, doctrine, package surface, tests, and
  upstream oRPC Zod-4 export.
- Recorded the inherited unrelated `deno.lock` change.
- Captured a pre-fix HTTP 400 negative control.
- Made the unchanged request return HTTP 200 with numeric `cycleId: 1` and verified its generated
  OpenAPI parameter is numeric.
- Passed scoped check/lint/fmt, 87 package tests, 5 MCP OpenAPI read-tool tests, code-quality,
  doctrine, doc-lint, and publish dry-run gates.

## In Progress

- Commit and push the implementation/evidence slice, update PR/issue evidence, and transition the
  PR to the milestone-composed evaluation surface.

## Next Steps

1. Commit and push source, test, and run evidence without staging `deno.lock`.
2. Post the implementation phase comment and update the structured acceptance evidence.
3. Mark PR #1256 ready for the draft→ready augment/OpenHands/orchestrator composition.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Alias Zod-4 experimental export | upstream API inspection | Internal-only name adaptation. |
| Test actual query transport | issue #1250 | Prevents present-but-inert false green. |
| Preserve dirty lockfile | owner + AGENTS.md | Never stage it. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-onboarding-quickwin-1250--1250/**` | new | Harness activation and locked plan. |
| `packages/service/src/primitives/handlers.ts` | changed | Selects the Zod-4 smart coercion adapter. |
| `packages/service/tests/handlers_test.ts` | changed | HTTP + generated OpenAPI numeric-query regression. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | 42-file scoped wrappers; doc-lint; publish dry-run |
| Fitness | PASS | scoped quality 0/0; doctrine 0 FAIL; repository quality gate exit 0 |
| Runtime | PASS | RED 400 → GREEN 200 with numeric `cycleId: 1` |
| Consumer | PASS | service 87/87; MCP OpenAPI tools 5/5 |

## Open Questions

- None blocking.

## Drift and Debt

- Drift: authorized milestone evaluation composition; inherited lock modification.
- Debt: no new/deepened debt expected.

## Commits

- See the draft PR's commit list + per-slice PR comments.
