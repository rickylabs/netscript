### S1 Slice 7 green-up: platform-paths sub-slice

Commit: `b7f130b` (`test(greenup): platform paths — preserve windows schema roots`)

Before -> after failure count: expected `10 failed` -> expected `9 failed` after targeted fix. This removes both failed BDD steps in the runtime schema test.

Disposition:
- `packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas_test.ts:48` exposed a real platform path bug: POSIX `resolve()` prefixed cwd onto `C:/workspace/...`.
- `:85` was the same root cause, because the planned path did not match the pre-seeded unchanged file.
- Fixed product code with Windows-aware project path resolution while preserving native `@std/path.resolve` behavior for normal paths.

Proof:

```text
deno test --allow-all packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas_test.ts
ok | 1 passed (4 steps) | 0 failed (21ms)
```
