# Drift

- 2026-06-30 — `deno task arch:check` did not match the brief's baseline claim that all 13 roots were already `FAIL=0`. The task fails before touched roots on pre-existing `packages/plugin-auth-core` doctrine findings (`FAIL=12`, auth cast / `@ts-*` checks). S-b touched roots were checked independently and returned `FAIL=0` for `packages/plugin-sagas-core` and `plugins/sagas`. No auth files were edited because that would widen the approved S-b/S-c/S-d scope.
- 2026-06-30 — S-c repeated `deno task arch:check`; it failed on the same pre-existing `packages/plugin-auth-core` findings before touched roots. S-c touched roots were checked independently and returned `FAIL=0` for `packages/plugin-triggers-core` and `plugins/triggers`.
- 2026-06-30 — S-d repeated `deno task arch:check`; it failed on the same pre-existing `packages/plugin-auth-core` findings before touched roots. S-d touched roots were checked independently and returned `FAIL=0` for `packages/plugin-workers-core` and `plugins/workers`.
- 2026-06-30 — S-e verified the auth-core red was pre-existing gate-scope drift from #172a-2d/#179,
  not relocation-slice source churn. The documented diagnosis was correct for the centralized
  contract cast and `@ts-expect-error` guards; the first S-e `arch:check` run also exposed the same
  test-only over-flag for runtime `as unknown` assertions in
  `packages/plugin-auth-core/tests/contracts/auth-contract-soundness_test.ts`. No doctrine text or
  gate comment required auth tests to differ from the equivalent sagas/workers contract soundness
  tests, so the fix exempts test paths from the auth cast / `@ts-*` scanner while preserving the
  production auth no-extra-cast rule.
