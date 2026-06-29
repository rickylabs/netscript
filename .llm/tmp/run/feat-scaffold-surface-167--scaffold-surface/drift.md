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

## 2026-06-29 — S2 workers connector on adapter contract

- **Severity:** minor
- **Plan reference:** S2 workers connector; repoint workers to `@netscript/plugin/adapter`, delete
  `src/scaffold/*`, delete `src/scaffolding/*`, and keep genuine runtime CLI features.
- **Observed:** `packages/cli` has no direct import of
  `@netscript/plugin-workers/scaffolding` or `@netscript/plugin-workers/scaffold`, so there is no
  workers-specific host import to fix in S2. The generic S4 host repoint list remains:
  `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts` still executes the
  manifest `./scaffold` target over `--context-json`; `plugins-group.ts` still exposes the old
  framework verb taxonomy from `FRAMEWORK_VERBS`; `features/plugins/add/add-plugin.ts` still owns
  the `plugin add` install orchestration and full-source `renderPlugin()` branch; `render-plugin.ts`
  still owns the legacy full-source plugin render path; CLI tests under
  `features/plugins/{add,dispatch}` still assert `./scaffold` metadata.
- **Decision:** Do not edit `packages/cli` in S2. Workers now exposes the new adapter entrypoint as
  `./adapter-cli` while preserving the existing runtime `./cli` export for
  `src/cli/composition/main.ts`. `./scaffolding` was removed because no in-package consumer remains.
- **Publish gate note:** `.llm/tools/run-publish-dry-run.ts --help` is not a help path; it attempts
  workspace publish and fails on S3-owned stale connectors (`plugins/auth/scaffold.ts` imports the
  removed `@netscript/plugin/scaffold`). Per the S2 prompt, the authority used for workers was
  `cd plugins/workers && deno publish --dry-run --allow-dirty`, which passed.
- **Runtime boundary:** `src/cli/local-runtime-backend.ts` preserves genuine runtime commands
  (`list-*`, `run`, `logs`, config, registry compile). Its `add-*` cases now delegate to the adapter
  `ItemScaffolder` resources, so the deleted `workers-cli-backend.ts` and `src/scaffolding/*`
  template path are not duplicated.
