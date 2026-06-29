# Drift

## 2026-06-29 — S1 v2 workspace gate surface crosses into S2 connectors

- **Severity:** significant
- **Plan reference:** S1 gates named `deno task test` and `run-publish-dry-run.ts` while S1 scope
  also forbids touching `plugins/*`.
- **Observed:** `deno task test --filter plugin` fails before running filtered tests because Deno
  resolves `plugins/auth/src/scaffold/scaffold.test.ts`, which imports the removed v1
  `@netscript/plugin/scaffold` export. `.llm/tools/run-publish-dry-run.ts` is workspace-only and
  likewise fails on `plugins/auth/scaffold.ts` for the same stale S2 connector import.
- **Decision:** Do not reintroduce the wrong v1 `src/scaffold/*` replacement and do not edit
  `plugins/*` in S1. Use S1-owned package gates instead: scoped check/lint/fmt on `packages/plugin`,
  `deno test --allow-all packages/plugin`, adapter doc-lint over `src/adapter/mod.ts`, and
  package-local `deno publish --dry-run --allow-dirty --allow-slow-types`.
- **Follow-up:** S2-S4 must repoint `plugins/*` and CLI dispatch to the new adapter contract before
  workspace-level test/publish gates can be used as final merge-readiness evidence.
