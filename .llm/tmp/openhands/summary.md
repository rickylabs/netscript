# IMPL-EVAL Summary — Wave 4 · 4b workers

## Verdict
**PASS**

Run: `feat-package-quality-wave4-runtimes--4b-workers`  
PR: #19 → umbrella #16  
Base: umbrella `2c24662` (4a merged) + 4b merge `173357c`  
Evaluator: Separate-session IMPL-EVAL  

## Summary

Validated `@netscript/plugin-workers-core` (A3) and `@netscript/plugin-workers` (A5) against the harness v2 quality gates defined in the NetScript Architecture Doctrine. Both packages now pass `isolatedDeclarations`, `doc-lint`, dry-run, and test gates. The only code change required was adding explicit `z.ZodType<…>` type annotations to three exported Zod schemas in `plugin-workers-core` so the TypeScript compiler can emit `.d.ts` files without inferring types from initializer expressions.

## Changes

### `packages/plugin-workers-core/src/contracts/v1/workers.contract-schemas.ts`

Added explicit type annotations to satisfy `--isolatedDeclarations` (enforced by root `deno.json`):

- `WorkerJobConfigContractSchema` → `z.ZodType<WorkerJobConfigContract>`
- `WorkerJobContractSchema` → `z.ZodType<WorkerJobContract>`
- `JobRegistryContractSchema` → `z.ZodType<JobRegistryContract>`

These annotations allow the TypeScript compiler to generate declaration files without needing to analyze the Zod `.strict()` call chains, which are not expressible in `.d.ts` output.

## Validation

### `@netscript/plugin-workers-core` (A3)

| Gate | Command | Result |
|------|---------|--------|
| `deno check` | `deno task check` | ✅ Pass |
| Tests | `deno task test` | ✅ 16 passed, 0 failed |
| Dry-run | `deno publish --dry-run --allow-dirty` | ✅ Success (no slow-types warnings on the changed schemas) |
| Doc-lint | `deno doc --lint mod.ts` | ✅ Pass (no missing exports) |

### `@netscript/plugin-workers` (A5)

| Gate | Command | Result |
|------|---------|--------|
| `deno check` | `deno task check` | ✅ Pass |
| Tests | `deno task test` | ✅ 5 passed, 0 failed |
| Dry-run | `deno publish --dry-run --allow-dirty` | ✅ Success (2 pre-existing dynamic-import warnings only) |

### Remaining slow-types warnings (pre-existing, not introduced by this change)

Both packages carry two **expected** `unanalyzable-dynamic-import` warnings that are by design:

- `plugin-workers-core/src/runtime/job-dispatcher.ts:30` — runtime adapter bootstrap
- `plugins/workers/services/src/main.ts:84` — plugin service bootstrap
- `plugins/workers/src/cli/workers-cli-backend.ts:107` — CLI module loader

These dynamic imports load user-provided modules at runtime and cannot be statically analyzed. They are **not** slow-types blockers for JSR publishability (the publish dry-run succeeds).

## Responses to Review Comments or Issue Comments

None applicable — this is a continuation of the harnessed IMPL-EVAL pass for PR #19.

## Remaining Risks

1. **A5 package directory name vs. naming convention**: `@netscript/plugin-workers` lives under `plugins/workers/` rather than `packages/plugin-workers/`. This is consistent with the Tier-2 plugin pattern used elsewhere (`plugins/streams/`, etc.) and does not block gates, but it can confuse archetype mapping if future harness runs expect all A5-shape packages under `packages/`.
2. **Pre-existing dynamic imports**: The three `unanalyzable-dynamic-import` warnings are architectural (runtime module loading). They should be tracked as accepted debt rather than re-investigated on every wave. If the JSR publish gate ever hardens to reject *any* dynamic-import warnings, these will need inline suppression or a refactor to static imports.
3. **No e2e:cli run**: The full `deno task e2e:cli` suite was not executed per harness guidance (“expensive; run during evaluator/merge-readiness pass or when explicitly requested”). If the merge-readiness gate requires it, it should be run in a separate session.
