# Context Pack: rbp-dlq-contract implementation

## Status

Implementation complete for slice `rbp-dlq-contract` on branch
`feat/prime-time/rbp-dlq-contract`.

## Scope Delivered

- Added `DeadLetterRecord<T>`, `DeadLetterReason`, `DeadLetterStorePort<T>`, and `NackOptions`.
- Added KV, PostgreSQL, Redis, and memory dead-letter stores.
- Wired KvPolling, PostgreSQL, Redis, DenoKv, AMQP, Memory, factory, and typed-queue validation paths.
- Documented at-least-once delivery, poison-message DLQ behavior, backing stores, extension point,
  and runtime permissions in `packages/queue/README.md`.

## Commits

See `.llm/tmp/run/feat-prime-time-rbp-dlq-contract--impl/commits.md`.

## Gate Summary

- Scoped queue check/lint/fmt: PASS.
- Targeted DLQ tests: PASS, 22 passed.
- `deno doc --lint packages/queue/mod.ts packages/queue/ports/mod.ts packages/queue/adapters/mod.ts`: PASS.
- `(cd packages/queue && deno task publish:dry-run)`: PASS.
- JSR audit: exit 0, `dry-run: OK`; one known banner false-positive warning for slow types.
- `check-doctrine.ts --root packages/queue`: PASS_WITH_WARNINGS, no failures.
- Root `deno task arch:check`: FAIL_BASELINE from repo-wide pre-existing failures outside this slice.

## Residual Risk

- `KvPollingAdapter` and `PostgresAdapter` remain above doctrine file-size warning thresholds. This
  predates the slice and is visible in scoped doctrine output.
- `KvPollingAdapter.reprocessDlq()` now re-enqueues from the public `DeadLetterRecord` contract, so
  provider-private fields such as original priority are reset to current adapter defaults.

## Next Step

Supervisor should launch IMPL-EVAL for PR #80.
