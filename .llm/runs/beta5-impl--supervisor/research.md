# Research - beta5-impl--supervisor

## Re-baseline

- Carried-in source: user-provided issue #303 remainder brief for beta.5 chores wave.
- Re-derived against `main` at `1c1759908e99c68a3bb0cccfd7a35aeafd8d40e0` on 2026-07-06.
- What changed vs carried-in version:
  - No existing run dir for `beta5-impl--supervisor` was present in this worktree.
  - The branch `chore/303-enterprise-surface-sweep` has no upstream branch yet.
  - Commit `86eca907` exists and documents the sole sanctioned oRPC-bound slow-types exception in
    `docs/architecture/doctrine/02-public-surface.md` and `.llm/tools/fitness/audit-jsr-package.ts`.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | There are 35 publishable `@netscript/*` package/plugin roots with a JSR export map under `packages/` and `plugins/`. | `deno eval --ext=ts '<inventory script>'` from repo root. |
| 2 | Full-export-map doc lint is already wrapped by `.llm/tools/run-deno-doc-lint.ts`, exposed as `deno task doc:lint`. | `deno.json` task `doc:lint`; `.llm/tools/run-deno-doc-lint.ts` header. |
| 3 | Root quality wrappers already scope check/lint/fmt over `packages` and `plugins`, with exclusions documented in `deno.json`. | `deno task check`, `deno task lint`, `deno task fmt:check` entries in `deno.json`. |
| 4 | The sanctioned slow-types exception is narrow: oRPC-bound packages only, from commit `86eca907`. | `git show --stat --oneline --name-status 86eca907`; doctrine file 02. |
| 5 | Issue #303 is partial acceptance for this PR; the PR body must use `Refs #303`, not a closing keyword. | User brief and `netscript-pr` closing-keyword rules. |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: planned full export map for every publishable `@netscript/*` package/plugin root:
  35 roots, not just `mod.ts`.
- Slow-type / surface risks:
  - Existing oRPC-bound slow-types allowance from `86eca907` is sanctioned and must remain.
  - New slow-types allowances are prohibited. Any slow-type diagnostic requiring public API redesign
    is a stop/deferral item for `notes.md`, not a public API rewrite in this slice.
  - Multi-subpath packages may false-flag if only `mod.ts` is linted; use the full export map wrapper.

## Open questions

- None blocking the plan. If doc-lint or dry-run uncovers an API-shape change rather than a
  documentation/type-annotation fix, defer it to `notes.md` and continue with independent trivial
  fixes.
