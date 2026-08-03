use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md` and `.agents/skills/netscript-tools/SKILL.md`
before coding. You are the implementation lane (Codex · GPT-5.6 Sol · low) for slice **S1** of epic
#1169. The Tier-A supervisor reviews your work before sign-off; do not self-certify, do not open or
merge PRs, do not push to any branch other than `feat/1169-one-pass-publish`.

## Slice S1 — command-gate retry + attempt-visible verdicts (closes #1168)

Worktree: `/home/codex/repos/ns004-onepass`, branch `feat/1169-one-pass-publish`.
Scope: `packages/cli/e2e/` only. Do NOT touch `.llm/tools/release/`, `.github/workflows/e2e-cli-prod*.yml`,
or anything outside the e2e package except the run dir worklog.

### Design contract (LOCKED — implement exactly this; record any forced divergence in
`.llm/runs/feat-1169-one-pass-publish--design/drift.md`)

1. **Failure classification.** In `packages/cli/e2e/src/domain/gate-definition.ts` add
   `GateFailureClass = 'timeout' | 'canceled' | 'assertion'` and
   `GateAttempt = { attempt: number; verdict: 'passed' | 'failed'; durationMs: number; failureClass?: GateFailureClass; exitCode?: number }`.
   Extend `GateResult` with `attempts: GateAttempt[]` (always populated, length ≥ 1) and
   `retried: boolean`. Classification rules:
   - executor reported timeout → `timeout`
   - exit code 6 AND stderr contains `task was canceled` (case-insensitive) → `canceled`
   - any other nonzero exit → `assertion`
2. **Retry policy.** `commandGate()` in
   `packages/cli/e2e/src/application/gates/scaffold/gate-factory.ts` gains an optional
   `retry?: { classes: readonly GateFailureClass[]; maxRetries: 1 }`. `CommandGate.execute`
   (`packages/cli/e2e/src/application/gates/command-gate.ts`) loops at most `1 + maxRetries`
   attempts; a retry happens ONLY when the attempt's failureClass is in `retry.classes`.
   **An `assertion` failure is never retried regardless of configuration** — enforce in code, not
   by convention. Named constants for the retryable class list and max attempts.
3. **Apply to exactly one gate**: `runtime.aspire-restore`
   (`packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts:70-86`) with
   `retry: { classes: ['timeout', 'canceled'], maxRetries: 1 }`. No other gate opts in for S1.
4. **Visibility.** The report JSON (`packages/cli/e2e/src/domain/report.ts` +
   `application/builders/reporting/reporting-builder.ts`) includes `attempts` and `retried` per
   gate. Console output for a retried-pass must be visibly distinct, e.g.
   `PASSED (attempt 2/2 after canceled attempt 1, 41s + 903s)`. A first-attempt pass prints as
   today. `.llm/tools/e2e/print-failed-report-steps.ts` must still parse the new shape (update if
   it validates the schema).
5. **Instrumentation (the #1168 transient-vs-ceiling question).** Each attempt's `durationMs` is
   recorded whether it passes or fails; when a gate exhausts retries, the failure output prints all
   attempt durations so "attempt 2 also hit 900s" is readable directly from the log.

### Tests (negative cases are the point)

In `packages/cli/e2e/` test files alongside existing ones, with a fake `CommandExecutor`:

- assertion failure (exit 1) with retry configured → exactly 1 attempt, verdict failed, class `assertion`
- timeout → 2 attempts; second passes → verdict passed, `retried: true`, attempts array shows both
- exit 6 + `task was canceled` → classified `canceled`, retried
- exit 6 WITHOUT the canceled marker → classified `assertion`, NOT retried
- both attempts time out → verdict failed, both durations present
- no retry configured → single attempt, `attempts.length === 1`, `retried: false`

### Gates you must run and record (append evidence to
`.llm/runs/feat-1169-one-pass-publish--design/worklog.md` under `## S1 evidence`)

```
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli/e2e --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts
deno test (scoped to the e2e package's unit tests — the new tests must run and pass)
```

Do NOT run `deno task e2e:cli` (expensive; supervisor decides). No new `deno-lint-ignore`,
no `any`, no `as unknown as` — each is a review-blocking finding.

### Done means

- All tests above pass; scoped wrappers green; evidence recorded in the worklog.
- One commit on `feat/1169-one-pass-publish`, message:
  `feat(e2e): retry timeout-class gate failures once, visibly (#1168) — assertion failures never retry`.
  Commit, do not push — the supervisor reviews, signs off, and pushes.
