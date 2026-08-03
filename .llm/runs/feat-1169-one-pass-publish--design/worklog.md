# Worklog — feat-1169-one-pass-publish--design

## Design

### Public surface

- `packages/cli/e2e`: `GateResult` extended with `attempts: GateAttempt[]` (per-attempt verdict,
  durationMs, failure class); `commandGate()` gains an opt-in `retry` policy
  (`{ classes: ['timeout','canceled'], maxRetries: 1 }`). Report JSON surfaces attempts.
- `.llm/tools/agentic/github/pr-checks.ts` → `deno task agentic:pr-checks -- --repo … --pr …`:
  latest-run-per-name rollup with per-check classification
  (`current-pass | current-fail | retried-pass | superseded | cancelled | stale-post-merge`).
- `.llm/tools/validation/check-close-gate.ts`: `Report` gains
  `{ headSha, evaluatedAt, issues: [{ number, updatedAt, bodySha256 }] }`.
- Local suite lease: `.llm/tools/e2e/suite-lease.ts` (pattern from
  `agentic/runtime/sender-ownership.ts`); refusal exits non-zero and names holder + path.

### Domain vocabulary

- `GateFailureClass = 'timeout' | 'canceled' | 'assertion'` — the retry predicate keys off this,
  never off "nonzero exit" generically.
- `CheckRunClassification` union above.

### Ports

- Existing `CommandExecutor` port unchanged; retry lives in `CommandGate`, not the executor.

### Constants

- Retry-eligible classes, max attempts (2), lease path, check-name set — named constants.

### Commit slices

Per plan.md table (S1…S7), one PR per slice, each with a negative-case demonstration.

### Deferred scope

- Any edit to `e2e-cli-prod*.yml`, `.llm/tools/release/`, canary surface (brief: propose-and-wait).
- A shared cross-tree "verdict provenance" library (decision 2).

### Contributor path

A contributor adding a retryable gate reads `command-gate.ts` (retry policy + failure classes in
one file) and copies the `commandGate(…, { retry })` pattern; report consumers read
`domain/report.ts` for the attempts shape.

## Log

- 2026-08-03: Bootstrap, research (code sweep of all seven surfaces), plan + design written.
  Notable: `duplicate_sender_risk` refusal already exits 4 with tests — F5 re-scoped to
  verify-and-audit. Slicing proposal posted on #1169 (deliverable 1). Awaiting PLAN-EVAL
  (separate open-model session) before any implementation slice.
