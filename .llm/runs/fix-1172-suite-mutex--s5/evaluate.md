# IMPL-EVAL — S5: expensive-suite mutual exclusion (#1172)

- **Evaluator**: Claude Code + OpenRouter · `qwen/qwen3.7-max` · separate session from generator
- **PR**: #1185 (closes #1172)
- **Worktree**: `/home/codex/repos/ns004-s5-lease`
- **Branch**: `fix/1172-suite-mutex`
- **Head commit**: `0d52f8777` (sign-off) on `09c89be53` (implementation)
- **Plan**: `.llm/runs/feat-1169-one-pass-publish--design/plan.md` → slice S5
- **Plan-Gate**: owner-waived (drift.md records written approval)

## Verdict: **PASS**

## Gate evidence

| Gate | Exit | Result |
| --- | ---: | --- |
| `deno task --cwd packages/cli/e2e test` | 0 | 84 passed, 0 failed |
| `run-deno-check.ts --root packages/cli/e2e --ext ts` | 0 | 119 files, 0 findings |
| `run-deno-lint.ts --root packages/cli/e2e --ext ts` | 0 | 119 files, 0 findings |
| `run-deno-fmt.ts --root packages/cli/e2e --ext ts` | 0 | 119 files, 0 findings |

## Code review: suite-runner.ts + suite-lease.ts

### A. Lease acquired ONLY for SCAFFOLD.RUNTIME
**PASS** — `suite-runner.ts:61-63`: ternary guards on `suite.id === SCAFFOLD.RUNTIME`; all other suites get `lease = undefined`.

### B. Lease released in finally on ALL failure paths
**PASS** — `suite-runner.ts:64/127-129`: outer `try/finally` wraps entire body; `lease?.release()` is idempotent (boolean guard at `suite-lease.ts:104-108`). No early returns exist before the finally block.

### C. Contention error names pid, worktree, lease path
**PASS** — `SuiteLeaseContentionError` at `suite-lease.ts:41-50`: message template includes `${holder.pid}`, `${leasePath}`, `${holder.worktree}`, `${holder.suiteId}`, `${holder.startedAt}`.

### D. Dead-holder stale break
**PASS** — `suite-lease.ts:89-102`: on exclusive-create failure, reads and parses existing lease, checks `isProcessAlive(holder.pid)` via `Deno.kill(pid, 0)`. Dead → notice + remove + retry loop. Only `Deno.errors.NotFound` treated as dead; EPERM conservatively treats as alive.

### E. Error class
**PASS** — `SuiteLeaseContentionError extends Error`, `this.name = 'SuiteLeaseContentionError'`, exported for `instanceof` checks.

## Live-holder reproduction (evaluator-independent)

Wrote lease file with live shell PID to `/tmp/netscript-e2e-scaffold-runtime.lease`, invoked `createDefaultSuiteLeaseManager().acquire("scaffold.runtime", …)` via `deno eval`:

```
ERROR_NAME: SuiteLeaseContentionError
ERROR_MESSAGE: E2E suite contention: refused to start because pid 4128646 holds
  /tmp/netscript-e2e-scaffold-runtime.lease for scaffold.runtime from worktree
  /home/codex/repos/ns004-s5-lease since 2026-08-03T00:00:00.000Z.
  This is a contention verdict, not a product failure.
HOLDER_PID: 4128646
HOLDER_WORKTREE: /home/codex/repos/ns004-s5-lease
LEASE_PATH: /tmp/netscript-e2e-scaffold-runtime.lease
EVAL_EXIT=1
```

Lease cleaned up after test. Non-zero exit confirmed; named holder confirmed.

## CI workflow verification

### e2e-cli.yml: job-level concurrency on scaffold-runtime ONLY
**PASS** — Diff shows 3 lines added at `scaffold-runtime` job:
```yaml
    concurrency:
      group: e2e-scaffold-runtime-global
      cancel-in-progress: false
```
Global group (not ref-scoped) serializes across all PRs. `cancel-in-progress: false` queues rather than cancels. Workflow-level `concurrency` (pre-existing, ref-scoped, `cancel-in-progress: true`) remains for all other jobs. Job-level block takes precedence for scaffold-runtime only.

### e2e-cli-prod*.yml and ci.yml untouched
**PASS** — `git diff origin/main` for all three files is empty. Decision 4 from plan.md honored.

## Concept of Done

- Approved scope complete: CI queueing + local lease + contention naming + dead-holder stale break + runner release in finally + negative tests.
- Static gates pass (check/lint/fmt on `packages/cli/e2e`).
- Runtime gate: 84/84 tests including suite-lease and suite-runner cases.
- No doctrine violation introduced (no `packages/` framework code; `packages/cli/e2e` is workspace-internal test harness).
- Run artifacts updated (worklog with gate table, real live-holder transcript, sign-off).
- Supervisor sign-off commit `0d52f8777` present.
- Negative case demonstrated: forced collision names itself (test + real eval reproduction).

## Findings

None. All plan requirements satisfied with evidence.
