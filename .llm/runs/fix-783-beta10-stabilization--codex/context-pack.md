# Context Pack: fresh-ui Markdown direct rendering

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-783-beta10-stabilization--codex` |
| Branch | `fix/783-beta10-stabilization` |
| Current phase | `implementation` |
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

- Implementation slice commit/push and canonical full scaffold runtime gate.

## Next Steps

1. Commit and explicitly push the implementation slice; post phase evidence to draft PR #790.
2. Run the canonical full `scaffold.runtime` gate.
3. Update final artifacts and PR body without marking ready or self-certifying.

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
| Consumer | pass, final gate pending | actual `ui:add` render/build regressions; full scaffold pending |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: explicit `unified` dependency; stronger baseline type failure; no daemon attachment.
- Debt: no new debt; unrelated legacy `fresh-ui` doc-lint debt remains out of scope.

## Commits

- See the draft PR's commit list + per-slice PR comments after bootstrap push.
