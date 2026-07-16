# Context Pack: fresh-ui Markdown direct rendering

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-783-beta10-stabilization--codex` |
| Branch | `fix/783-beta10-stabilization` |
| Current phase | `implementation complete — awaiting supervisor IMPL-EVAL` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Current State

Issue #783 was reproduced at the copied registry layer and fixed there. The Markdown item now uses
an ordered unified pipeline ending in `rehype-react` with the Preact JSX runtime, declares only its
direct renderer dependencies, and no longer installs React or `react-markdown`. Actual `ui:add`
output type-checks, renders the content/security matrix, production-builds in Fresh, and hydrates in
a browser with zero console messages.

## Completed

- Required skills, harness docs, doctrine, rules, and issue read.
- Branch/base/worktree and clean status verified.
- Public surface inspected with `deno doc`.
- Owning-layer reproduction and scratch feasibility proof captured.
- Plan and Design checkpoint locked.
- Direct renderer, registry dependency/docs, generated mirror, and regressions implemented.
- Scoped check/lint/fmt, 137 package tests, architecture, production build, browser hydration,
  doc-lint, and publish dry-run completed.

## In Progress

- Final evidence commit/push and PR handoff to the supervisor-owned evaluator.

## Next Steps

1. Commit and explicitly push this final evidence update.
2. Update draft PR #790 body/comment with the complete gate matrix.
3. Stop at `status:impl-eval`; the supervisor owns evaluation and any later readiness transition.

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
| `packages/fresh-ui/registry/**` | modified | Direct renderer, helper typing/docs, generated mirror. |
| `packages/fresh-ui/registry.manifest.ts` | modified | Direct dependency graph; React wrapper removed. |
| `packages/fresh-ui/tests/registry/**` | modified/new | Helper, copied renderer, production-build regressions. |
| `.llm/runs/fix-783-beta10-stabilization--codex/*` | modified | Harness evidence and drift. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pass | scoped check/lint/fmt; actual copied renderer check |
| Fitness | pass with external scan debt | arch pass; quality scan finds two untouched plugin issues |
| Runtime | pass | production client/SSR build and browser hydration |
| Consumer | pass | actual `ui:add` render/build regressions; canonical scaffold runtime 60/60 |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: explicit `unified` dependency; stronger baseline type failure; no daemon attachment.
- Debt: no new debt; unrelated legacy `fresh-ui` doc-lint debt remains out of scope.

## Commits

- `b3b91648` — harness bootstrap and locked plan.
- `a0d44c2a` — direct Preact renderer, registry graph/docs, generated mirror, and regressions.
- Final evidence-only commit follows this context-pack update.
