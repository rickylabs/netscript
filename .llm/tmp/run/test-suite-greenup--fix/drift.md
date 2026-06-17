# Drift Log

## 2026-06-17 — Step 0 Re-enumeration

- Severity: significant
- Divergence: Deno 2.8.3 did not simply reproduce the inventory failure set. The queue timer tests
  now pass, while `packages/plugin-workers-core/tests/executor/deno-runtime-adapter_test.ts` now runs
  and fails two tests.
- Decision: Remove queue timer work from the active fix list and add `worker-runtime-adapter` as a
  new root-cause sub-slice.

