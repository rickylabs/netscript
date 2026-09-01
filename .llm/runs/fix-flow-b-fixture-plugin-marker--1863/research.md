# Research — fix-flow-b-fixture-plugin-marker--1863

## Re-baseline

- Carried-in source: issue #1863 and the owner-provided leaf brief.
- Re-derived against `origin/main` @ `3b6386e14bd2176de795dad16fe523f5cd1fbcff` on 2026-09-01.
- The worktree is clean and the branch, `origin/main`, and merge base all resolve to that SHA.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The fixture searches for the removed name-based comment and uses the following comment as its block boundary. | `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts:116` |
| 2 | The plugin generator emits positional comments but retains semantic `addExecutable(name, ...)` and `plugins.set(name, resource)` code. | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-plugins.ts:64,89,212` |
| 3 | The nested `packages/cli/e2e` workspace is explicitly outside the doctrine root set; the parent `packages/cli` verdict remains Archetype 6 / Keep. | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:33,93` |

## jsr-audit surface scan

- N/A: this leaf changes only the nested CLI E2E fixture and focused tests. It changes no package
  export, published type, dependency, permission declaration, or JSR surface.

## Open questions

- None. The brief fixes the ceiling, anchor class, RED/GREEN requirement, and runtime exclusions.
