### S1 Slice 7 green-up: official-plugin-samples sub-slice

Commit: `a621a8c` (`test(greenup): official samples — align generated config assertions`)

Before -> after failure count: expected `1 failed` -> expected `0 failed` after targeted fix.

Disposition:
- `packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-samples_test.ts:11` was stale fixture/doc drift.
- The generator now emits worker jobs inside `defineWorkers({ groups: ... jobs: [...] })`, not standalone `defineJob(...)` calls.
- Updated only the stale text assertions to check the generated job IDs in the current config shape. Runtime task JSON, saga, trigger, and sample-pruning assertions remain intact.

Proof:

```text
deno test --allow-all packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-samples_test.ts
ok | 2 passed | 0 failed (221ms)
```
