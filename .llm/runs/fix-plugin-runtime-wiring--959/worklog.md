# Worklog — plugin-runtime-wiring

## 2026-07-31 — implementation

- Verified issue framing against current code. Corrected #959 and #962 on the issues.
- Separated immutable package specifier/version from mutable instance keys when emitting runtime
  entrypoints.
- Made removal delete the exact instance declaration from `netscript.config.ts`, idempotently.
- Made manifest resolution follow Deno workspace member `name`/`exports` metadata.
- Emitted selected Redis/cache registration imports into generated processor/app entrypoints.
- Updated the cache provider error to name `@netscript/sdk/cache`.

### Regression evidence

- Focused suite: 25 passed, 0 failed.
- Fails-before: cache-emission guard failed 1/2 after temporarily removing emission; restored and
  passed 2/2.
- Fails-before: workspace-resolution guard failed 0/1 after temporarily bypassing workspace
  resolution; restored and passed 1/1.
- Scoped check/lint/fmt passed for `packages/cli`, `packages/plugin`, and `packages/sdk`.
- `deno task quality:scan`: PASS.
- `deno task arch:check`: PASS with existing warnings only.

### Deferred gates

- Full `scaffold.runtime` E2E: NOT RUN during the implementation loop; reserved for the harness
  evaluator/merge-readiness pass per repository policy.

