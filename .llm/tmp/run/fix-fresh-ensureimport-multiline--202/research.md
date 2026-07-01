# Research

## Scope

- Branch: `fix/fresh-ensureimport-multiline`
- Issue: GitHub #202, `@netscript/fresh` page-module rewrite corrupts a module when the final top-level import is multi-line.
- Target files:
  - `packages/fresh/src/application/route/manifest-page-module.ts`
  - `packages/fresh/src/application/route/manifest-page-module.test.ts`

## Re-Baseline

- Current checkout is on `fix/fresh-ensureimport-multiline` tracking `origin/main`.
- The worktree contains the user brief as untracked `.llm/tmp/brief-202.md`; it is not part of the implementation commit.
- Existing tests for `computePageModuleRewrite` are colocated in `packages/fresh/src/application/route/manifest-page-module.test.ts`.
- `ensureImport()` is private and used through `computePageModuleRewrite`, so regression coverage should exercise the public module-local rewrite function instead of expanding exports.

## Findings

- `ensureImport()` currently finds the insertion anchor with `/^import\b[^\n]*\n/gm`.
- That anchor only covers the first line of a multi-line import, so a generated import can be inserted inside the final import declaration.
- Side-effect imports must remain supported; a fix that only searches for `from` is insufficient.
- `specifierMatch.test(source)` already preserves idempotency and should remain the early return.
- No public API or package export change is required.

## JSR / Public Surface Scan

- Planned public surface change: none.
- JSR risk: low. The change is internal codegen behavior and colocated tests.
- Slow-type risk: none introduced.

## Open Questions

- None blocking. The issue's secondary Form C non-canonical accessor observation is explicitly deferred.
