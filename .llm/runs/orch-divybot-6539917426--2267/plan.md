# Plan & Design — READY FOR REVIEW

Issue #2267: complete all storage mutations before any watch notification.
Archetype: 2 Integration. Existing doctrine Refactor verdict/debt is retained.

## Locked decisions

1. Storage helpers return a `WatchEvent` (or undefined for an absent delete).
   They update storage and TTL state synchronously without invoking watchers.
2. Atomic commits collect those events locally, then dispatch them in mutation
   order after the entire loop. No shared buffering state, yield, or timer.
3. Standalone set/delete dispatch their returned event immediately. Expiration
   dispatch remains at the existing sweep boundary. Preserve previousValue,
   versionstamp, duplicate-key event order and missing-delete behavior.
4. Use the existing `WatchEvent` contract; no new public types or dependencies.
5. Regression tests exercise real fixed-key and prefix iterators and interpose
   the registered synchronous handler through TypeScript private-member bracket
   access. Reads captured there test the otherwise invisible ordering boundary.
   Assertions run after delivery so callback exception swallowing cannot hide red.

## Slices

- S0: bootstrap/design records; gate = factual source and issue cross-check;
  files = this run directory. Commit, push, open draft PR before implementation.
- S1: add focused atomic-watch regressions, prove red on unchanged adapter, then
  implement storage/event separation and prove green. Files = memory adapter,
  `tests/memory-atomic-watch_test.ts`, worklog/context/evaluation evidence here.
  Gate = full KV structured test run, scoped structured check/lint/fmt, package
  doc-lint/publish/JSR audit, quality:gate plus standalone arch:check if needed,
  separate-session review. Record original-file negative controls for every new
  test. Commit/push the reviewed slice and comment evidence on the draft.
- S2: reconcile review findings, complete run records, push final evidence.
  Mark ready once review has no blockers; final IMPL-EVAL targets exact pushed
  head. Canonical READY report via excluded final-report file. No merge.

## Gates and acceptance

- Structured test wrapper: `packages/kv` with `--allow-all --unstable-kv --frozen`;
  conditional Redis integration skips must remain explicit.
- Structured check/lint/fmt wrappers: changed TypeScript files, unstable KV check.
- Required broader `deno task quality:gate` and doctrine/dependency checks.
- `deno task doc:lint --root packages/kv`, package `publish:dry-run`, repository
  `.llm/tools/fitness/audit-jsr-package.ts --root packages/kv --text`.
- Acceptance: overlapping CAS exactly one winner (existing contract); no partial
  commit reads at key/prefix notification and public consumer boundaries (new
  tests); TTL unchanged (existing TTL test plus relevant regression observations).
- Each newly registered test must fail with production file restored to baseline.
- Review-thread gate, CI snapshot at final head, exact-head Claude verdict.
- No scaffold/plugin output, DB wiring, or Aspire helpers touched. Local CLI E2E
  prohibited by owner; expensive e2e-cli-gate label belongs to coordinator.

## Risks and mitigation

- False-green public async test: capture reads synchronously at notification.
- Lost previous values / duplicate-key events: retain each mutation's event.
- TTL regression: reuse storage/heap/sweep semantics and run unchanged TTL tests.
- Global pre-existing gate failures: capture baseline before production edits,
  compare identical findings and report honestly; do not alter unrelated code.
- Evaluation evidence moves head: commit sanitized interim review evidence,
  then resume evaluator at immutable final pushed head without another commit.

## Open decisions, deferred scope, debt

No must-resolve design question remains. Safe to defer: existing adapter split,
rollback for invalid/throwing mutations, reference-cloning semantics, Redis
infrastructure provisioning. None is required for successful commit ordering.
No new architectural debt intended. No public contract or docs redesign.
