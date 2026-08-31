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
