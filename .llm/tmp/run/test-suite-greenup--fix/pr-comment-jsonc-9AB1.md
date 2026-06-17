### S1 Slice 7 green-up: jsonc-parser sub-slice

Commit: `a88e219` (`test(greenup): jsonc parser — parse workspace deno configs`)

Before -> after failure count: full-suite baseline `11 failed` -> expected `10 failed` after targeted fix.

Disposition:
- `packages/config/workspace.test.ts:6` was a real parser bug: workspace discovery used strict `JSON.parse` for Deno `deno.json`, which is JSONC.
- Fixed product code to use `@std/jsonc` and added the package-local import.
- `deno.lock` changed additively by one `@std/jsonc` reference.

Proof:

```text
deno test --allow-all packages/config/workspace.test.ts
ok | 1 passed | 0 failed (44ms)
```
