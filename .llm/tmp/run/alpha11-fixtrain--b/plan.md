# alpha.11 fix-train Slice B plan

## Locked decisions

- Do not widen `QueryClientPort`; rewrite generated templates to use existing query-client methods.
- If F-15c reproduces in generated `vite.config.ts`, fix the Vite plugin typing in
  `packages/fresh`. It reproduced, so this slice includes the fix.
- Keep changes at template/source level, regenerate embedded CLI assets, and prove the result with a
  fresh generated workspace `deno task check`.

## Commit slices

1. Scaffold type-soundness fix:
   - Files:
     - `packages/cli/src/kernel/assets/app/routes/examples/(_shared)/service-showcase.ts.template`
     - `packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab.tsx.template`
     - `packages/cli/src/kernel/assets/embedded.generated.ts`
     - `packages/cli/src/kernel/adapters/scaffold/import-resolver.ts`
     - `packages/cli/src/maintainer/adapters/local-import-resolver.ts`
     - `packages/cli/src/kernel/templates/app/generators-config_test.ts`
     - `packages/fresh/src/application/vite/vite.ts`
   - Gates:
     - Fresh scaffold generated workspace `deno task check`
     - Scoped package check/lint/fmt evidence for touched packages
     - Focused CLI asset/config tests and Fresh Vite tests

## Risks

- Generated asset barrel can drift from template source. Mitigation: run `deno task gen:assets-barrel`
  and template registry tests.
- Vite plugin type changes can break existing hook tests. Mitigation: run
  `packages/fresh/src/application/vite/vite.test.ts`.
- Existing CLI README formatting drift can obscure package-wide fmt. Mitigation: record raw
  TypeScript-only fmt evidence and do not touch unrelated Markdown.

## Deferred scope

- No SDK `QueryClientPort` expansion.
- No repo-wide formatting cleanup.
- No full `scaffold.runtime` E2E; the requested authoritative gate is a clean generated workspace
  `deno task check`.
