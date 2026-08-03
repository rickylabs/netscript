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

## S1 evidence

- 2026-08-03 · S1 implementation: added attempt-visible command-gate results and an opt-in,
  one-retry policy. `runtime.aspire-restore` is the only opted-in gate. Assertion failures are
  rejected by the retry predicate even when `classes: ['assertion']` is explicitly configured.
- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts`
  → exit 0; 117 files selected, 0 failed batches, 0 findings.
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli/e2e --ext ts`
  → exit 0; 117 files selected, 0 findings.
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts`
  → exit 0; 117 files selected, 0 failed batches, 0 findings.
- `deno task --cwd packages/cli/e2e test` → exit 0; 80 passed, 0 failed. Includes six fake-executor
  command-gate cases and retried-pass/exhausted-retry console visibility cases.
- `deno test .llm/tools/e2e/print-failed-report-steps_test.ts` → exit 0; 4 passed, 0 failed. The
  existing parser remains compatible with the extended report step shape; no parser edit needed.
- Harness supplemental gate: `deno task quality:gate` via `rtk proxy` → exit 0. Quality scan found
  no violations; architecture checks completed with only pre-existing non-failing warnings.
- `deno task e2e:cli` intentionally not run; the S1 brief reserves that expensive gate for the
  Tier-A supervisor.

## S1 sign-off (Tier-A review)

- 2026-08-03 · Substantive review of `26970dad9`: retry predicate hard-blocks `assertion` in code
  (`shouldRetry`), attempts/retried flow GateResult → StepResult → report JSON via spread in
  `runGate`; pretty reporter distinguishes retried-pass and prints all attempt durations on
  exhaustion. Six negative-case tests verified present. Minor accepted debts: HTTP-gate deadline
  failure classed `assertion` (http gates cannot opt into retry, so inert); skipped gates record a
  `passed` attempt (GateAttempt has no `skipped`). Positional `commandGate` args growing — future
  cleanup candidate.
- Independent gate re-run by supervisor: scoped check/lint/fmt 117 files 0 findings; package tests
  80/80; diff smell scan (deno-lint-ignore / as unknown as / `: any`) = 0.
- Reconcile: #1168 remains open until PR merge; instrumentation-decision acceptance box (transient
  vs ceiling) satisfiable only at first real retry occurrence — recorded honestly, not asserted.

## S1 transient-vs-ceiling evidence (fills #1168 box 5)

- CI run 30845659110 (this PR): `runtime.aspire-restore: PASSED 5558ms` cold, attempt 1 — 0.6% of
  the 900s ceiling. Verdict: stall-class, not ceiling-bound; retry chosen accordingly, ceiling
  unchanged. All #1176 checks settled green except close-gate (mirror pending ready-merge label).
