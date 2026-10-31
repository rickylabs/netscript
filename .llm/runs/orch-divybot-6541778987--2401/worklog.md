# Worklog

## Design

1. **Public surface:** existing `netscript db` commands keep exit-code/cleanup behavior while waiting without spawning a CLI process every second. No new package exports.
2. **Vocabulary:** follower = owned long-lived NDJSON Aspire child; resource update = one named resource state; completion = terminal executable state with numeric exit code.
3. **Ports:** existing `AspireCommandExecutor` gains a stream method; cancellation uses AbortSignal and lifecycle uses async-iterator disposal. Existing AppHost lock and request-file seams remain.
4. **Constants:** named follow arguments, total timeout and buffer bounds; existing terminal-state set retained.
5. **Commit slices:** bootstrap/draft → adapter/runner regression proof/docs → final evidence/handoff, with gates and files in plan.md.
6. **Deferred scope:** upstream patch/upgrade; converting explicit one-shot user commands; existing finite internal stage snapshots. Scaffold.runtime is required CI evidence, coordinator arms label.
7. **Contributor path:** `packages/cli/src/kernel/adapters/database/operations/aspire-command-executor.ts` defines the single Aspire command/stream seam.

## Routing authority

Owner grant verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.” This overrides matrix evaluator model selection and effort; preserves session and family separation. Matrix feature policies remain two plan/five implementation rounds. No repository profiles loaded.

## Bootstrap

- Read complete assignment; preflight issue/comments and PR search found no covering PR. PR #2235 was an unrelated search hit (service authentication).
- Consulted previous environment/validation memory; no connected memory tool exists. RTK missing; focused raw reads plus structured wrappers are used.
- Asked NetScript MCP find_guidance then search_docs before design. Guidance points to existing event observation and distinguishes NDJSON follow from snapshot resources arrays.
- Bootstrap baseline matches origin/main. No runtime resources started.

## PLAN-EVAL round 1

FAIL_PLAN: independent reviewer required locking initial-snapshot-before-start ordering plus fresh nonterminal transition, and specifying exact negative-control/reaping assertions. Plan corrected before source work; same evaluator resumes for round 2. Initial terminal state is ignored and an ambiguous terminal-only stream fails closed.

## Implementation and local proof

- PLAN-EVAL round 2 PASS before source work; independent Anthropic reviewer, same evaluator resumed. Records: plan-eval-round-1.md and plan-eval.md.
- Existing AspireCommandExecutor owns stream process/UTF-8 lines, bounded stderr tail, abort, SIGTERM→SIGKILL grace, pipe closure and status reaping. No second CLI execution path introduced.
- Watch establishes initial matching snapshot before resource start, ignores old terminal snapshots, requires fresh nonterminal→terminal lifecycle, validates exact name/type and integer exit code, and closes under one deadline. Resource cleanup only stops a requested start; request removal survives stop failure.
- Polling guard now checks shipped CLI source plus existing E2E source. Templates and SDK pins unchanged.
- Structured tests: 53 passed, zero failures/ignores; includes three simulated minutes with one stream and zero snapshot describes, stale/fast runs, missing exits, malformed/ended streams, real fake CLI stderr backpressure, owner abort, quiet timeout and TERM-ignoring forced kill.
- Negative control: temporarily restored baseline operation-runner.ts, ran entire runner test file via wrapper, exit 1; named one-stream regression failed 0 versus 1, migration test also found forbidden describe. Source restored in finally. An initial nested-BDD filter selected zero tests and was rejected as non-evidence; rerun above is the actual control.
- Structured check: 13 selected files, zero errors. Lint/fmt: 7 selected and 7 processed, zero findings/refusals, explicit local config overrides root CLI exclusions. Root quality:gate passed (zero scan findings; seven existing allowances), Aspire host-port scan passed (1304 files), docs links passed (105 docs; zero broken links/anchors). CLI JSR audit baseline/final: exit 0, dry-run OK, one existing slow-type warning and 23 existing warnings unchanged.
- Sanitized structured evidence in gate-results.json; raw output remains outside Git. No real AppHost or containers started; no uncertain-owned resources encountered. No lock/cache mutation.
- Required scaffold.runtime CI remains UNPROVEN and coordinator-owned; readiness must request its verdict. This is a downstream mitigation, not an upstream repair or zero-leak claim.
- Reconcile: implementation is limited to six existing DB adapter/test files, one polling guard test, reference docs and this run; operation-runner shrank from 486 to under 470 lines. No new exports/dependencies or accepted architecture debt.

## Consumer documentation carrier

Canonical gen:agent-docs-prose completed: site source-format/build/rendered-output passed (253 HTML pages), 93 registry artifacts built. The carrier decoded diff contains exactly pages/reference/aspire/index.md (+2867 characters, leak guidance present); no other generated page or file changed. This necessary consumer documentation refresh is recorded in drift.md. CLI JSR audit: exit 0, dry-run OK, one pre-existing slow-type warning, 23 existing warnings unchanged from baseline. Review-thread gate: PASS, zero threads.

## Independent slice review

IMPL-EVAL round 1 PASS, no source/evidence blockers (evaluate.md); independent Anthropic session, same reviewer resumed. Final exact pushed-head attestation follows after push and ready transition, without mutating the reviewed commit. Built-site carrier freshness: fresh=true, stalePaths=[], exit 0.
