# Drift Log

## 2026-06-17 — Step 0 Re-enumeration

- Severity: significant
- Divergence: Deno 2.8.3 did not simply reproduce the inventory failure set. The queue timer tests
  now pass, while `packages/plugin-workers-core/tests/executor/deno-runtime-adapter_test.ts` now runs
  and fails two tests.
- Decision: Remove queue timer work from the active fix list and add `worker-runtime-adapter` as a
  new root-cause sub-slice.

## 2026-06-17 — Catalog Resolution Gate Blocker

- Severity: significant
- Divergence: After all listed failing tests were fixed, `deno task test` still exited 1 even though
  the summary showed `0 failed`, because Deno emitted `Unsupported scheme "catalog"` while resolving
  member package graphs.
- Decision: Treat this as a green-gate blocker, not a test deletion/quarantine case. Materialize
  member `catalog:` imports to `npm:` specifiers using the root catalog versions, matching the
  existing publish dry-run policy.
