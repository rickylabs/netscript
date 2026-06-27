# alpha.11 fix-train Slice B context pack

## Status

Implementation committed; push/PR pending at artifact update time.

## Branch / thread

- Branch: `fix/scaffold-typecheck-alpha11-b`
- Codex thread: `019f09d4-0752-7600-88f2-0660c7521db3`

## Files changed

- `packages/cli/src/kernel/assets/app/routes/examples/(_shared)/service-showcase.ts.template`
- `packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab.tsx.template`
- `packages/cli/src/kernel/assets/embedded.generated.ts`
- `packages/cli/src/kernel/adapters/scaffold/import-resolver.ts`
- `packages/cli/src/maintainer/adapters/local-import-resolver.ts`
- `packages/cli/src/kernel/templates/app/generators-config_test.ts`
- `packages/fresh/src/application/vite/vite.ts`

## Gate summary

- Generated workspace `deno task check`: PASS, exit 0.
- F-15c: reproducible on current branch, fixed.
- SDK `QueryClientPort`: unchanged.
