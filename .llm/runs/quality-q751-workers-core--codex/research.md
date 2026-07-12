# Research — quality-q751-workers-core--codex

## Re-baseline

- Carried-in source: rejected prior commit `006c859a902ac6b4189b0f78abebf23794774a7b` recovered from the local object database.
- Re-derived against `main` @ `3b3d615bb535d985e49a4d2dcdcce5e03097babc` on 2026-07-12 after the owner-required hard reset.
- What changed vs the carried-in version:
  - The rejected commit reached scanner green by retaining **14** inline `quality-allow` suppressions.
  - The clean baseline contains **50 findings and 0 allowances**. This run treats every finding as a typing problem first and sets an internal target of 0 allowances (acceptance ceiling: 5).

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | Scanner baseline is 50 findings / 0 allowances across 14 files. | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/plugin-workers-core` |
| 2 | The rejected prior attempt contained 14 allowance markers. | `git grep -n quality-allow 006c859a -- packages/plugin-workers-core` |
| 3 | Sixteen builder findings come from mutating one generic class instance across incompatible typestate/payload parameters; the builder and domain layers also duplicate handler/definition types. | `src/builders/{job,task,workflow}-builder.ts`, `src/builders/builder-types.ts`, `src/domain/*` |
| 4 | Seventeen config/contract findings cast concrete Zod schemas into parse-only structural facades instead of carrying `z.input` and `z.output`; several exported response types are manually widened to `Record<string, unknown>`. | `src/config/*.ts`, `src/contracts/v1/workers.contract-{schemas,types}.ts` |
| 5 | Four stream findings recreate upstream schema/producer facades even though `defineStreamSchema<TDef>` and `createDurableStream<TDef>` already preserve `StateSchema<TDef>` and `DurableStreamProducer<TDef>`. | `deno doc --filter defineStreamSchema packages/plugin-streams-core/mod.ts`; same for `createDurableStream` |
| 6 | Five composition findings bridge parallel runtime/port definitions; default classes are close to the runtime contracts but `ShutdownManager` and `WorkflowExecutor` lack stable `id` fields. | `src/runtime/{composition-root,runtime-types}.ts`, `src/ports/*`, `src/{shutdown,workflow}/*` |
| 7 | Package publish dry-run is green on baseline. | `(cd packages/plugin-workers-core && deno publish --dry-run --allow-dirty)` |
| 8 | Baseline doc-lint reports 4 `private-type-ref` diagnostics in the oRPC contract surface and no missing JSDoc. This is pre-existing contract debt, not introduced by #751. | `deno task doc:lint --root packages/plugin-workers-core --pretty`; debt `workers-contract-structural-server-export` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: all 17 exports in `packages/plugin-workers-core/deno.json`; public API inspected first with `deno doc packages/plugin-workers-core/mod.ts`.
- Slow-type / surface risks:
  - schema constants must keep explicit concrete Zod return/constant types or exported `z.input`/`z.output` aliases so isolated declarations remain fast;
  - oRPC route types must retain explicit schema annotations and must not widen route IO;
  - upstream stream types should be imported and instantiated rather than structurally re-declared;
  - no export-map change is planned, so no changelog/public-subpath change is required.
- Baseline `deno publish --dry-run --allow-dirty`: PASS, 0 slow-type errors.

## Open questions

- None that force rework. Surviving allowances are not pre-authorized; any candidate must first demonstrate a specific TypeScript/upstream structural impossibility and is independently reviewed.
