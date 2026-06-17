### S1 Slice 7 green-up: worker-runtime-adapter sub-slice

Commit: `023c758` (`test(greenup): worker runtime — pin deno executable fixture`)

Before -> after failure count: expected `9 failed` -> expected `7 failed` after targeted fix.

Disposition:
- `packages/plugin-workers-core/tests/executor/deno-runtime-adapter_test.ts:5` and `:25` were newly surfaced under Deno 2.8.3.
- Root cause was fixture/environment drift: the test inherited `DENO_EXECUTABLE=/root/.dotnet/tools/deno`, causing subprocess spawn to fail before the adapter contract was exercised.
- Fixed the test to pin `DENO_EXECUTABLE` to `Deno.execPath()` during each real subprocess assertion and restore the original env afterward.

Proof:

```text
deno test --allow-all packages/plugin-workers-core/tests/executor/deno-runtime-adapter_test.ts
ok | 2 passed | 0 failed (76ms)
```
