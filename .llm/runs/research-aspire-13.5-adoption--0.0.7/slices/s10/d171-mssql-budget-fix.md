use harness

## SKILL

- netscript-harness — commit + push, run-dir artifacts; no self-certification.
- netscript-doctrine — `packages/cli/e2e` is framework code; record behavioural changes per Operating
  Rule 5.
- netscript-tools — scoped check/lint/fmt; `git ls-remote` before any `--force-with-lease`.

## D-171 — S10 IMPL-EVAL returned CHANGES_REQUESTED. Fix the dropped MSSQL convergence budget.

Verdict: [comment](https://github.com/rickylabs/netscript/pull/1760#issuecomment-5474133063) (see the
PR's IMPL-EVAL comment). Two findings; the first is behavioural and must be fixed.

### Finding 1 (Medium) — MSSQL's extended budget was silently dropped

Base's wait path passed `String(expectation.timeoutSeconds)` — **600s for mssql** — to
`verify-listener-readiness.ts`. This slice **deleted that assertion** from
`runtime-gates_test.ts:523-545` (it now asserts only `command.includes(resource)`), and the new
`runtimeWaitGate` consumes only `listenerExpectation.healthCheckKey`
(`runtime-gates.ts:24,37`). The actual convergence budget is now a uniform
`resolveDbCliTimeoutSeconds()` — **300s default** (`describe-follow.ts:171`,
`operation-runner-helpers.ts:24`).

Consequences:
- `ListenerReadinessExpectation.timeoutSeconds` (`listener-readiness-gates.ts:24,49`) is now consumed
  by **nothing** on the convergence path; `listenerReadinessWaitCommand` survives only in its own
  D-101 test.
- **A slow MSSQL cold start now fails `runtime.aspire-start` 300s in**, where it previously had 600s.
  It fails loudly rather than silently, but it is a real behavioural regression.
- Per **Operating Rule 5** the change is unrecorded — the slice's `drift.md` (D-01…D-10) never
  mentions it.

### Required fix — in this slice's own files only

Do **not** edit the D-101 module (`listener-readiness-gates.ts`) — that contract is
coordinator-protected. Choose one:

- **(a)** derive the capture timeout from the **max expectation timeout for the selected database**,
  so mssql regains 600s; or
- **(b)** set `ASPIRE_CLI_START_TIMEOUT` for the mssql tier.

Then:
1. **Restore a real assertion** that pins the per-database budget — the deleted
   `runtime-gates_test.ts:523-545` assertion existed precisely to catch this. It must fail if mssql's
   budget silently collapses to the uniform default.
2. **Record the accepted change in the slice's `drift.md`** with the reasoning, per Operating Rule 5.
   If you keep a uniform budget deliberately, that is a *decision* and must be written down as one —
   not left implicit.

### Finding 2 (Medium-low) — wait gates assert a capture the restart fallback can invalidate

All `runtime.wait.*`, `runtime.wait.app` and `runtime.aspire-describe` gates became replays of the
single NDJSON captured by `runtime.aspire-start` (`runtime-gates.ts:33-38,51-56,215-219`), whereas the
base ran `aspire wait` **live after** the DB step. If the restart fallback
(`ASPIRE_TYPED_DB_COMMAND_OR_RESTART_SCRIPT`) fires, the replayed capture can describe a topology that
no longer exists. Either re-capture after the DB/restart step, or document explicitly why the
pre-DB capture remains valid. Address it on the merits; if you disagree, say so with file:line
evidence rather than skipping it.

### Gates

Focused tests for the touched gate/runtime modules; scoped check/lint/fmt; repo-wide
`deno task check` expecting `failedBatches: 0`; `check:aspire-version-parity` `fail=0`.

**No runtime** — host runtime is parked; do not start Aspire or Docker. **No PLAN-EVAL, no
self-dispatched evaluator, no lifecycle label changes.** A fresh supervisor-dispatched IMPL-EVAL
follows.

Ancestry: **stacked** slice — assert `git merge-base HEAD bc838a0b3 == bc838a0b3` (S8's head). Do not
rebase onto `main`.

Push with `--force-with-lease` against a freshly read `git ls-remote` SHA. Report old/new head, the
budget mechanism chosen, the restored assertion, the drift entry, and every gate's exit code.
