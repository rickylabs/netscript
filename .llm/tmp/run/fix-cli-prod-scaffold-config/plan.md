# Plan

## Archetype

`packages/cli` is Archetype 6, CLI/tooling. The change touches generated workspace output, public CLI process behavior evidence, and UI registry scaffold support.

## Locked Decisions

- D1: add `@netscript/config` to the generated JSR-mode root `deno.json` imports with `netscriptJsrSpecifier('config')`.
- D1: delete the stale generated JSR TODO block from `netscript.config.ts`; do not change the actual `defineConfig` import or config body.
- D3: do not add process exits outside `bin/**`; prove the existing top-level binary catch exits non-zero on a real failure after D1 is fixed.
- D5: treat embedded registry content keys as POSIX manifest keys. Keep real filesystem path operations on OS-aware `@std/path`.

## Open Decisions

- None. The user supplied concrete fixes and acceptance gates.

## Risk Register

- Risk: import-map change could miss tests that assert the exact generated imports object. Mitigation: update generator tests and run scoped CLI check/lint/fmt.
- Risk: Windows path fix could accidentally switch real filesystem paths to POSIX. Mitigation: only use `@std/path/posix` at embedded content key lookups and keep `resolve`, `join`, `relative`, `dirname`, `isAbsolute`, and `toFileUrl` on `@std/path`.
- Risk: prod scaffold proof can mutate caches or lock state. Mitigation: do not use reload flags; inspect diffs before staging.

## Commit Slice

1. Cohesive fix commit for D1/D3-proof/D5.
   - Files: workspace templates/tests, UI registry content lookup, run artifacts.
   - Gates: scoped wrappers, prod scaffold proof, scaffold runtime E2E.

## Deferred Scope

- No CLI architecture restructuring.
- No dependency/version updates.
- No lock-file or cache deletion.

