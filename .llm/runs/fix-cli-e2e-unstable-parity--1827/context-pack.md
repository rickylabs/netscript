# Context pack: #1827 cli-e2e deno.unstable compiler-lib parity

P0, Internals-owned, blocks Features #1762. Branch `fix/cli-e2e-unstable-parity`, base `main` at
`0274c0a707e36ded3b4470a3911315f963e642d4`. PLAN-EVAL: N/A (owner ruling — mechanical config leaf).

## Scope

Add `deno.unstable` to `packages/cli/e2e/deno.json` in production order, plus a focused CLI/E2E
config-lib parity RED→GREEN test.

## Hard non-scope

- No changes to `health.ts`.
- No changes to anything owned by Features #1762.
- No changes to `run-deno-check.ts`.
- `deno.lock` must remain unchanged.

## Current State

- Supervisor correction: the production oracle is `packages/cli/deno.json`, whose libs are
  `["deno.ns", "deno.unstable", "dom"]`; repository-root order is not authoritative.
- The invalid `86443f47a` RED / `bbed08071` GREEN history had already reached the remote before the
  stop arrived. No further push is authorized.
- Honest RED was recaptured with the config path clean against `HEAD`: the exact requested
  `--allow-all` focused command exits 1, 0/1 passed, showing only the missing middle
  `deno.unstable` relative to the CLI oracle.
- Next: amend this RED receipt, apply and commit exact GREEN
  `["deno.ns", "deno.unstable", "dom"]`, then integrate exact main `a3e0a5aa…` at final freeze.
- Final freeze must recapture GREEN, four generated-corpus checks, the #1762 initiating-root
  before/after, a fresh isolated full check, lock/non-scope proof, and then force-with-lease push.
- IMPL-EVAL remains supervisor-owned.
