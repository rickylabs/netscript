# Plan

## Archetype

- Selected archetype: `ARCHETYPE-4` Public DSL / Builder, matching the doctrine verdict for `@netscript/fresh`.
- Overlay: `SCOPE-frontend`, because the behavior affects Fresh route/page module generation.
- Current doctrine verdict: `@netscript/fresh` is `Restructure` for existing builder-file debt. This PR does not deepen that debt.

## Locked Decisions

- Keep the fix inside `manifest-page-module.ts`; do not export `ensureImport()`.
- Replace the single-line import regex anchor with a small line-walk that finds the end of complete top-level static import declarations.
- Preserve the existing no-import prepend fallback.
- Test through `computePageModuleRewrite`, the smallest existing public seam in this module.
- Defer the secondary Form C non-canonical accessor observation from #202.

## Open-Decision Sweep

- No open decisions must resolve before implementation.
- Safe to defer: broader parser/AST migration, Form C non-canonical accessor idempotency, package restructure debt.

## Commit Slices

1. Fix `ensureImport()` anchoring and add regression tests.
   - Files: `packages/fresh/src/application/route/manifest-page-module.ts`, `packages/fresh/src/application/route/manifest-page-module.test.ts`.
   - Proving gates: focused `deno test`, scoped `run-deno-check`, scoped `run-deno-lint`, scoped `run-deno-fmt`.

## Gate Set

- Focused unit tests for `packages/fresh/src/application/route/manifest-page-module.test.ts`.
- Scoped package check: `.llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx`.
- Scoped package lint: `.llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx`.
- Scoped package format check: `.llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx`.
- Full scaffold runtime E2E is out of scope per brief.

## Risk Register

- Risk: line-walk mistakes TypeScript import variants.
  - Mitigation: cover multi-line named imports, side-effect imports, no-import fallback, and idempotency.
- Risk: helper overreach or public surface churn.
  - Mitigation: private helper only, no exports changed.
- Risk: harness evaluator separation unavailable in direct Codex execution.
  - Mitigation: record drift and still preserve artifacts and validation evidence.

## Debt / Deferred Scope

- Existing `@netscript/fresh` restructure debt remains unchanged.
- Deferred: #202 secondary Form C non-canonical accessor observation.
