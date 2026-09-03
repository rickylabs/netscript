use harness

## SKILL

- `netscript-harness` — run dir, worklog/drift, RED→GREEN discipline, separate-session eval.
- `netscript-doctrine` — `packages/plugin-workers-core` (contract archetype) and `plugins/workers` gates, debt entries.
- `netscript-deno-toolchain` — `deno doc` for the published surfaces; `deno publish --dry-run` for the workspace.
- `netscript-pr` — `Closes #1455` only when every remaining checklist item is evidenced; otherwise `Refs #1455` with the remainder stated.

# Implement brief — #1455 remainder: schema-backed payloads, typed `triggerJob`, literal job-ID→payload registry

Branch `feat/workers-payload-registry-map` (from `main` `79adb103b`), worktree `007-leaf-1455`.
Generator: Codex `gpt-5.6-sol` · high. Evaluator is a separate opposite-family session (not you).
Run dir: `.llm/runs/feat-workers-payload-registry-map--0.0.7/`. Prior plan/context you may reuse:
`.llm/runs/workers-payload-type-contract--plan/` (from merged #1938).

## What already landed (merged #1938, `89ac276bf` → main)

- `JobDefinition<TId, TPayload, TResult>` carries the payload generic through `JobBuilder.build()`.
- Trigger-core `enqueueJob` payload bound to the selected definition with `NoInfer`; consumer compile proof.

## Remaining scope (the unticked items of #1938's slice list = issue acceptance)

Confirmed by the EIS-Chat consumer audit on `v0.0.7-canary.6` (issue comment 2026-09-02): runtime
inspection still reports no payload schema; workers `triggerJob` still accepts
`Record<string, unknown>`; generated handlers remain `JobHandler<any>`; no literal
job-ID→payload registry/type map is exported.

- **S1 — schema-backed payload declaration + handler-boundary runtime validation**: allow
  `defineJob(...).payload(schema)` (Standard Schema / Zod 4 via the existing contract conventions)
  so the definition carries both the type and a runtime validator; validate at the handler boundary
  and at enqueue (same definition → producer and consumer cannot drift). RED: a runtime test that
  an invalid payload reaches a handler today.
- **S2 — generated literal registries**: the registry compiler (`plugins/workers/src/runtime/generated-jobs.ts`,
  `plugins/workers/src/cli/commands.ts`, and the CLI fixture `packages/cli/src/kernel/assets/registry-generator-fixture.ts`)
  emits literal `JobDefinition` types per job and exports a `JobPayloadMap` (`{ 'embed-document': EmbedDocumentPayload; … }`)
  instead of `JobHandler<any>`. RED: a compile-time test showing the emitted registry widens to `any`.
  Preserve the config-aware registry shape from #1451/#1872 — extend, do not rewrite.
- **S3 — typed `triggerJob`**: workers service `JobTriggerInput`/`triggerJob` keyed by the generated
  map so `triggerJob('embed-document', payload)` requires `EmbedDocumentPayload` (TS error on mismatch).
  Runtime contract (`packages/plugin-workers-core/src/contracts/v1/*`) stays wire-compatible; record
  any versioning decision in `drift.md`.
- **S4 — publish surface**: `deno doc --lint` on both packages, `deno task publish:dry-run`,
  `deno task arch:check`; JSDoc for every new public symbol.

## Ceiling

`packages/plugin-workers-core/**`, `plugins/workers/**`, `packages/cli/src/kernel/assets/registry-generator-fixture.ts`
(+ its generated counterparts via the canonical generator only), tests, and the run dir. No
`deno.json`/catalog/`deno.lock` changes, no dependency bumps, no `.github/`, no other plugins. If a
change forces a breaking published-surface contract, state it explicitly in the PR body (as #1938 did).

## Local gates before each push

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-workers-core --root plugins/workers --ext ts,tsx`
- `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/plugin-workers-core plugins/workers`
- lint + fmt wrappers on the same roots; `deno task quality:gate`; `deno task publish:dry-run`; `deno task arch:check`
- If the CLI fixture changed: the registry-generator tests under `packages/cli`.

## PR

Non-draft once S1+S2 are pushed. Labels `type:fix area:workers area:contracts priority:p1 orchestrator:fixes status:impl ci:full`,
milestone `0.0.7`. `Closes #1455` only if S1–S4 all land with evidence; otherwise `Refs #1455` and list
what remains. Keep `worklog.md` current per slice; end with final head and PR number.
