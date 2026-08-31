# Context pack: #1827 cli-e2e deno.unstable compiler-lib parity

P0, Internals-owned, blocks Features #1762. Branch `fix/cli-e2e-unstable-parity`, base `main` at
`0274c0a707e36ded3b4470a3911315f963e642d4`. PLAN-EVAL: N/A (owner ruling — mechanical config leaf).

## Scope

Add `deno.unstable` to `packages/cli/e2e/deno.json` in production order, plus a focused CLI/E2E
config-lib parity RED→GREEN test. The owner-authorized delta repair also makes the existing timeout
handle in `packages/cli/e2e/src/application/gates/scaffold/verify-producer-reconnect.ts`
platform-neutral after exact CI exposed the config change's whole-graph type consequence.

## Hard non-scope

- No changes to `health.ts`.
- No changes to anything owned by Features #1762.
- No changes to `run-deno-check.ts`.
- `deno.lock` must remain unchanged.

## Current State

- Supervisor correction: the production oracle is `packages/cli/deno.json`, whose libs are
  `["deno.ns", "deno.unstable", "dom"]`; repository-root order is not authoritative.
- The invalid remote `86443f47a` RED / `bbed08071` GREEN was rebuilt locally. Honest RED is
  `4c0db7fea`; exact GREEN is `27285b72a`.
- Exact main `a3e0a5aa8beebbd1f7a488d564d31980a7d74619` was integrated only at final freeze in
  `fef770b18`.
- Honest RED exits 1 with only the missing middle `deno.unstable`; final GREEN exits 0, 1/1 passed.
- The #1762 initiating-root proof is concrete at feature head `686eedb62`: its agent MCP E2E root
  resolves through CLI plugin registry -> plugin root -> service root -> health/KV, exits 1 before,
  and exits 0 after the one-line config change. Its full 2,974-file check changes from one failed
  batch to zero.
- Final scoped check/lint/fmt, check-runner tests, quality gate, all four generated-corpus checks,
  and the isolated-DENO_DIR 2,971-file full check pass. Lock/non-scope proof and remote repair remain.
- Exact CI at evaluator head `83d27ab7b` subsequently found TS2322 before test execution because
  the whole workspace resolves `setTimeout` to `Timeout` under the corrected lib set. Scoped file
  checks cannot reproduce that combined-graph effect.
- Delta RED at `83d27ab7b` exits 1 with 0 results and TS2322 in `processFailure`; repair commit
  `42f2d6acc` uses `ReturnType<typeof setTimeout>`. Delta GREEN exits 0 with 4,446 total results,
  4,427 passed, 19 ignored, and 0 failed. No sibling numeric timer-handle annotation remains.
- Repaired-head scoped check/lint/fmt, architecture, quality scan, all four generated-corpus checks,
  and lock/non-scope proofs pass. Delta IMPL-EVAL remains supervisor-owned.
