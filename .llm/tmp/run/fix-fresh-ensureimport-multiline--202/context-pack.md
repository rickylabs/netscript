# Context Pack

## Objective

Fix GitHub #202: `ensureImport()` in `@netscript/fresh` must insert generated imports after the last complete top-level import declaration, including multi-line and side-effect imports.

## Scope

- `packages/fresh/src/application/route/manifest-page-module.ts`
- `packages/fresh/src/application/route/manifest-page-module.test.ts`

## Validation Plan

- Focused `deno test` for `manifest-page-module.test.ts`.
- Scoped check/lint/fmt wrappers for `packages/fresh`.

## Current Status

- Implementation complete.
- Focused route rewrite tests and scoped check/lint/fmt gates pass.
- Package-wide raw `deno test packages/fresh/` is not a clean gate in this checkout without additional setup/permissions; recorded in `worklog.md`.
