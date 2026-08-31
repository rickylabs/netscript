## Summary

Moves the four `packages/ai` TanStack AI dependencies together to the current stable releases
reported by the repository's `deps:latest` tool. The upgrade also adapts the existing chat bridge
for TanStack 0.52's activity context, tool-end event, and AG-UI usage contracts.

## Scope

- Archetype / area: Archetype 4 Keep · `packages/ai` dependency adapters
- Closes #1695

## Slices

- [x] S1 coherent four-package bump, compatibility adaptation, focused tests, and lock evidence —
  `deps(ai): align TanStack AI dependency family`
- [ ] S2 one-time final `origin/main` integration and authoritative gate rerun

## Validation

- `deno task deps:latest --filter '@tanstack/ai*'` — RC 0; all four owned pins current (the two
  remaining rows are untouched `packages/fresh` pins)
- structured package check — RC 0, 101 files
- structured package tests — RC 0, 149 passed
- structured package lint / format — RC 0, no findings
- `deno task quality:gate` — RC 0
- JSR audit / package publish dry-run / dependency audit — RC 0; unchanged baseline warnings
- package doc lint — baseline RC 1; combined summary remains zero while the wrapper reports the same
  pre-existing per-entrypoint private-type diagnostics

## Harness

- Run dir: `.llm/runs/fix-tanstack-ai-caret-bump--1695/`
- Phase: impl — PLAN-EVAL was assessed N/A; IMPL-EVAL is a separate supervisor-dispatched session.

## Drift / Debt

- Authoritative stable core advanced from the issue's 0.48 example to 0.52.0.
- `rtk` is unavailable on this host; structured wrappers remain the verdict sources.
- Existing Fresh TanStack peer lag and package JSR/doc warnings are recorded but out of scope.

## Definition of Done

- [x] The four owned TanStack AI packages move coherently to repository-authoritative stable pins.
- [x] Breaking API changes are handled behind the owned chat-client boundary with regression tests.
- [ ] Current `origin/main` is merged exactly once and all authoritative gates pass at that head.
- [ ] A separate-session IMPL-EVAL records PASS before merge readiness.
