# Research — quality-q753-runtime--codex

## Re-baseline

- Carried-in source: rejected prior suppression-based pass described by the owner; no remote branch
  exists and the owner required a hard reset.
- Re-derived against the mandated base `3b3d615b` on 2026-07-12.
- The reset baseline scans at 31 findings and 12 existing `quality-allow` markers. The prior rejected
  branch cannot be inspected from `origin`, so 12 is the reproducible before allowance count.
- Agentic runtime status reported zero active sessions before this run.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The exact scoped scanner reports 31 findings and 12 allowances at base. | Run the acceptance scanner without `--max-allow`. |
| 2 | Timer casts in cron/KV erase a Web timer return type that is already usable through `ReturnType<typeof setTimeout/setInterval>`. | `packages/cron/adapters/memory.adapter.ts`; `packages/kv/adapters/memory.adapter.ts`. |
| 3 | Fedify's `ParallelMessageQueue` declaration is non-generic and uses upstream `any`, but exposes concrete `MessageQueueEnqueueOptions`, `MessageQueueListenOptions`, `queue`, and `workers`. | `deno doc --filter ParallelMessageQueue npm:@fedify/fedify`. |
| 4 | Database adapters route a plain SQL string through the tagged-template `$queryRaw` API by forging `TemplateStringsArray`; the correct Prisma boundary for a string is `$queryRawUnsafe`. | Three `packages/database/adapters/*` findings. |
| 5 | Prisma tracing casts `PromiseLike<T>` back to unconstrained `T`; overloads can preserve synchronous versus promise-like return shape. | `packages/database/prisma-tracing.ts:endSpan`. |
| 6 | Kvdex, mysql2, and Prisma adapter boundaries are locally erased with `any`/double casts despite usable structural or imported types. | `packages/kv/adapters/kvdex.ts`; `packages/prisma-adapter-mysql/src/adapter.ts`. |
| 7 | Saga KV values are asserted five times instead of being validated/narrowed once; the database helper also discards its inferred return type. | `plugins/sagas/services/src/routers/v1-{handlers,helpers}.ts`. |
| 8 | `defineStreamSchema<TDef>` already returns `StateSchema<TDef>`; trigger schemas currently replace Zod types with hand-written parser facades and six durable-stream allowances across the saga/trigger factories and schemas. | `deno doc --filter defineStreamSchema packages/plugin-streams-core/mod.ts`; trigger/saga stream files. |
| 9 | The base plugin error map and describe input use erasing casts/`any`; oRPC exposes `AnySchema`, `ErrorMap`, and builder generics that can express the seam. | `packages/plugin/src/contract-base/domain/base-contract.ts`; oRPC `deno doc` output. |
| 10 | All ten roots are published workspace units and expose local check/test/publish tasks; the acceptance contract additionally requires scoped wrappers and full export-map doc lint. | Each root's `deno.json`. |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: all export maps in the ten scoped `deno.json` files plus the public symbols that
  contain findings.
- Planned public API names and entrypoints remain unchanged. Type aliases may become more precise;
  no upstream package will be re-exported.
- Slow-type risks: generic return annotations for durable-stream factories, oRPC builder/error-map
  inference, and mysql2 dynamic imports. Every exported value/function must retain an explicit
  isolated-declarations-compatible annotation.
- Publish gate: run `deno publish --dry-run --allow-dirty` from every touched unit and record the raw
  result; run `deno task doc:lint --root <unit>` over each full export map.

## Open questions

- None that force rework. A surviving allowance is permitted only after a concrete upstream type
  mismatch is demonstrated in the worklog; the implementation target is zero allowances.
- `packages/plugin-streams-core` is outside the owner-listed roots. Its own four scanner findings
  remain deferred to its owning slice; this run consumes its public types but does not expand scope.
