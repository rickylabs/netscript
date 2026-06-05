# JSR `deno publish --dry-run` matrix

Generated 2026-05-04 — `deno 2.7.14` from `packages/<pkg>` and `plugins/<pkg>` working dirs with `--allow-dirty --no-check`.

| Target | Result | # problems | Dominant cause |
|---|---|---:|---|
| packages/cli | ✅ Success | 0 | Quality bar reference (stays the example) |
| packages/cron | ✅ Success | 0 | Clean adapters; needs README polish |
| packages/kv | ✅ Success | 0 | mod.ts re-exports kvdex; needs README + module docs |
| packages/logger | ✅ Success | 0 | Clean. Needs README, docs, tests upgraded |
| packages/queue | ✅ Success | 0 | Clean exports; needs surface harmonisation |
| packages/streams | ✅ Success | 0 | Clean; missing README |
| packages/telemetry | ✅ Success | 0 | Clean; missing module-tag on entrypoints |
| packages/runtime-config | ❌ FAIL | 1 | `missing-license` field |
| packages/watchers | ❌ FAIL | 1 | `missing-license` field |
| packages/prisma-adapter-mysql | ❌ FAIL | 2 | `missing-license` + 1 slow-type |
| packages/sdk | ❌ FAIL | 2 | 2 slow-types |
| packages/database | ❌ FAIL | 3 | 3 slow-types in PrismaClient typings |
| packages/fresh | ❌ FAIL | 4 | 4 slow-types in handler factories |
| packages/fresh-ui | ❌ FAIL | 6 | 6 slow-types in JSX prop generics |
| packages/sagas | ❌ FAIL | 13 | 13 slow-types in saga step builders |
| packages/aspire | ❌ FAIL | 20 | 20 slow-types in aspire DSL |
| packages/service | ❌ FAIL | 26 | 26 slow-types in service builder/registry |
| packages/triggers | ❌ FAIL | 29 | 29 slow-types in trigger DSL + handlers |
| packages/contracts | ❌ FAIL | 30 | 30 slow-types in contract DSL |
| packages/plugin | ❌ FAIL | 33 | 33 slow-types in plugin manifest types |
| packages/config | ❌ FAIL | 35 | 35 slow-types in builder/derive |
| packages/shared | ❌ FAIL | 35 | 35 slow-types in `utils/` and contract helpers |
| packages/workers | ❌ FAIL | 50 | 50 slow-types — biggest blocker |
| **plugins/hello-world** | ❌ FAIL | 1 | 1 slow-type |
| plugins/streams | ❌ FAIL | 3 | 3 slow-types |
| plugins/workers | ❌ FAIL | 3 | 3 slow-types |
| plugins/sagas | ❌ FAIL | 12 | 12 slow-types |
| plugins/triggers | ❌ FAIL | 16 | 16 slow-types |

Total: **7/24 packages** publish-clean today; **17/24 packages** + **5/5 plugins** must remove slow types.

## What "slow type" means here

`deno publish` rejects exported symbols whose types must be re-inferred at every consumer call site. Common offenders in this codebase are:

1. Generic factory return types inferred from a callback (e.g. `function defineX<T>(opts: T) { return { ...opts } }` → return type leaks `T` shape).
2. `as const` widening of exported objects without an explicit `satisfies SomeType`.
3. `z.infer<typeof Schema>` on an exported symbol where `Schema` is also exported (inferred chain).
4. Builder fluent APIs that thread generic accumulators through chained methods.

The fix pattern is always the same and is doctrine-mandated for v0.0.1-alpha:

```ts
// before
export function defineTrigger(spec) { return { ...spec, kind: "trigger" }; }

// after — explicit return type, slot generics on a published interface
export interface TriggerDefinition<TName extends string, TPayload> {
  readonly kind: "trigger";
  readonly name: TName;
  readonly payload: z.ZodType<TPayload>;
}
export function defineTrigger<TName extends string, TPayload>(
  spec: TriggerSpec<TName, TPayload>,
): TriggerDefinition<TName, TPayload> { ... }
```

This is the **single largest line item** in every refactor plan.

## License gates

`runtime-config`, `watchers`, and `prisma-adapter-mysql` simply lack the `"license": "MIT"` line — trivial fix folded into Wave 0/1 license-harmonisation slice.
