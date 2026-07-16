# Context Pack: fresh-ui Markdown direct rendering

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-783-beta10-stabilization--codex` |
| Branch | `fix/783-beta10-stabilization` |
| Current phase | `plan` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Current State

Issue #783 was fetched through the required token resolver/API path and reproduced in a real local
Fresh scaffold. Baseline copied Markdown fails type-check with three React-wrapper boundary errors.
A research-only scratch direct `rehype-react` + Preact processor passes type-check and SSR contract
assertions. No product source implementation has begun.

## Completed

- Required skills, harness docs, doctrine, rules, and issue read.
- Branch/base/worktree and clean status verified.
- Public surface inspected with `deno doc`.
- Owning-layer reproduction and scratch feasibility proof captured.
- Plan and Design checkpoint locked.

## In Progress

- Bootstrap commit, explicit push, and draft PR creation.

## Next Steps

1. Commit/push the harness bootstrap and open the required draft PR.
2. Implement direct renderer/dependency/docs/generated/test slice.
3. Add and run generated Fresh build/hydration regression.
4. Run all scoped, quality, doctrine, package, and scaffold gates; update artifacts/PR.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Archetype 4 + frontend | doctrine 06/10 | Package stays Keep-shaped. |
| Direct unified-to-Preact processor | issue #783 + upstream `deno doc` + scratch proof | No wrapper/compat boundary. |
| Explicit `unified` dependency | scratch consumer check | Former transitive dependency becomes direct. |
| Supervisor-owned eval | owner directive | This lane does not dispatch or self-certify. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-783-beta10-stabilization--codex/*` | new | Harness bootstrap only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | reproduction + scratch proof | baseline fail; candidate check pass |
| Fitness | planned | doctrine/archetype selected; executable gates pending |
| Runtime | scratch SSR pass | production/browser pending |
| Consumer | baseline reproduced | fixed generated-app gate pending |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: explicit `unified` dependency; stronger baseline type failure; no daemon attachment.
- Debt: no new debt; unrelated legacy `fresh-ui` doc-lint debt remains out of scope.

## Commits

- See the draft PR's commit list + per-slice PR comments after bootstrap push.

