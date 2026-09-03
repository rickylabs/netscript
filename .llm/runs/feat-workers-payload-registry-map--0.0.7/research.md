# Research — feat-workers-payload-registry-map--0.0.7

## Re-baseline

- Carried-in source: accepted contract at
  `.llm/runs/workers-payload-type-contract--plan/plan.md` and merged PR #1938.
- Re-derived against `main` @ `79adb103be568260e51b0eb3ba9fae281a5fe1f0` on 2026-09-03.
- What changed vs the carried-in version:
  - `JobDefinition<TId, TPayload, TResult>` and trigger-core `enqueueJob(... NoInfer<TPayload> ...)`
    have landed.
  - Runtime schema carriage, generated literal payload maps, and typed workers `triggerJob` remain
    absent, matching the EIS-Chat canary audit recorded on issue #1455.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | Root `JobBuilder.payload<T>()` remains argument-free and the builder does not store a schema. | `deno doc packages/plugin-workers-core/mod.ts`; `packages/plugin-workers-core/src/builders/job-builder.ts:46` |
| 2 | Root `JobDefinition` advertises `payloadSchema?`, but domain/runtime definitions and built values do not carry it. | `deno doc`; `src/domain/job-definition.ts`; `src/runtime/runtime-types.ts`; builder `build()` |
| 3 | `defineJobHandler` is a one-argument identity function, so invalid input reaches application code. | `packages/plugin-workers-core/src/public/root.ts:359` |
| 4 | Workers `JobTriggerInput` is still a non-generic `Record<string, unknown>` payload. | `deno doc packages/plugin-workers-core/src/contracts/v1/mod.ts`; `workers.contract-types.ts:31` |
| 5 | The runtime generator widens handlers before map construction and the manifest explicitly requests `JobHandler<any>`. | `plugins/workers/src/cli/runtime-registry-generator.ts:199`; `plugins/workers/scaffold.runtime.json:38` |
| 6 | The package-owned compiler and CLI fixture also emit widened maps, with no literal ID-to-payload export. | `plugins/workers/src/cli/registry-compiler.ts`; `packages/cli/src/kernel/assets/registry-generator-fixture.ts` |
| 7 | The service enqueue boundary resolves the selected definition before constructing the unchanged `JobMessage`. | `plugins/workers/services/src/routers/jobs.ts:87` |

## jsr-audit surface scan

- Surface scanned with `deno doc`: workers-core root, `./builders`, `./runtime`, and
  `./contracts/v1`; workers plugin root/runtime exports.
- Slow-type / surface risks: the real oRPC contract has the doctrine-sanctioned slow-type class;
  new public aliases must use package-owned Standard Schema shapes and receive JSDoc. No new
  dependency or export subpath is needed.

## Open questions

- None. The owner-provided implement brief plus the accepted plan lock the remaining contract.

