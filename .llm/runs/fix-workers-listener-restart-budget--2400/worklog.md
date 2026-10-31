# Worklog

## Design

1. Public surface: WorkerOptions.listenerHealthyResetMs default60000; WorkerHealthStatus.listeners failureCause with safe fixed child incident message; existing max restarts Infinity documented. No new package entrypoint.
2. Vocabulary: healthy running window, restartBudgetUsed (current burst), preserved cumulative restartCount (shared monitor), safe failure cause store-write-refused/connection-unavailable/listener-error.
3. Ports: existing now/sleep/AbortSignal/run/onFailure seams, MessageQueue and core ChildHealthMonitor; no new port. Integration test real DenoKV and RedisAdapter.
4. Constants: healthy default60000; existing defaults3,100,5000 remain authoritative at construction; finite failure categories and fixed redacted messages. No magic success timer.
5. Commit slices: bootstrap/run artifacts; one bounded implementation+tests/docs slice proven by specified gates; CI repairs only when justified.
6. Deferred: #2144 dispatcher/execution, queue adapter behavior, shared resource configuration, broader existing doctrine/doc debt and unrelated tracker cells.
7. Contributor path: read worker/listener-supervisor.ts and adjacent tests; options flow from worker-options.ts to worker.ts and queue-consumer.ts; tuning guide explains public use.

## Routing

Native `deno task agentic:matrix --tier feature --json` inspected. Owner/coordinator brief override: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.” Uses repo-native claude-print launcher, not ad-hoc agent launch. Codex generator and Claude evaluator differ in session/vendor. Exact private session handle retained outside public checkout. Feature max2 plan/max5 impl, same evaluator across rounds. No profiles/ read.

## Bootstrap

Current main rebaseline and #2400 issue/ownership checked. New worktree follows project layout after correcting git shim redirection. No source change before PLAN-EVAL. Baseline existing supervisor/options tests6 PASS. Baseline doc lint has2 preexisting private-type-ref findings in core workers contract, /worker clean. JSR audit no FAIL. PLAN-EVAL round1 FAIL_PLAN: preserve published restartCount semantics and name concrete integration/HTTP health assertions. Plan repaired before any production code; separate restartBudgetUsed chosen. Same evaluator round2 next.

PLAN2 PASS before implementation, same independent Opus5.5/high evaluator. Published counter semantics preserved; resettable field additive. Baseline full quality/architecture gate PASS; baseline full workers doc lint FAIL2 inherited core contract private-type-ref, /worker0 findings. Private Redis7 server ready, no shared daemon mutation.

## Implementation and gate evidence

Implemented the additive window and resettable restartBudgetUsed. restartCount stays cumulative in listener and aggregate health; backoff is per burst and overflow-safe for indefinite zero-delay retries. Error/cause classification emits fixed strings into actual childHealth.lastFatalError, with legacy raw local diagnostics explicitly documented. All jobs/tasks/triggers receive the window. Worker validates it before allocating runner resources.

Structured gate results (working tree before sign-off; private receipts attest their command/head22d1531, not a clean committed source hash):

| Gate | Result |
| --- | --- |
| Worker/runtime/public tests, Redis enabled | PASS72, failed0, ignored0, frozen |
| Focused listener tests | PASS19, including actual RedisACL and local DenoKV |
| Old never-reset negative control, real stores | FAIL2 expected: both exhausted the budget before recovery; no skips; source restored in finally |
| Typecheck whole workers plugin | PASS124 files,2 batches |
| Changed TypeScript lint/fmt | PASS8 files |
| Full quality:gate (quality + arch + deps) | PASS, durable private receipt |
| Catalog-materialized workers publish dry-run | PASS |
| Full workers doc lint | FAIL2 unchanged inherited core contract private-type-ref; /worker0 both baseline/current |
| JSR audit | No FAIL; preexisting cardinality/banner warning |

The private Redis7 server is run-owned, no shared Docker daemon. ACL tests modify only a new random test user and queue keys, process real messages between each refusal, and clean them up. Tests also prove all three listener families expose fixed category messages on the Worker childHealth/onStarted surface; cumulative totals remain4 after budget0; a shorter100ms test reset cannot clear shared crash-loop health early. A fake performance.now stub is explicitly checked in the Worker tests.

An initial typecheck caught a test import-map mismatch; using the already recorded npm:ioredis@^5.11.1 selector repaired it without dependency/lock changes. The sole extra exact selector introduced experimentally was removed; retained root lock bytes match baseline. No dispatcher/job-execution edits. Next independent slice review before sign-off commit, then push/CI/final exact-head review.

## Slice1 signoff and reconcile

Independent Opus5.5/high IMPL1 PASS precommit (evaluate.md), same session as PLAN2. Reviewer independently ran18 tests with Redis intentionally unset and1ignored; real Redis/negative receipts were inspected, not claimed independently rerun. Signed off for source commit. Reconciled issue2400 ownership and PR2482 comments: no competing leaf or findings. PR2481 shares worker option/composition files but remains open; no dispatcher/execution edits made here. Existing inline test selector already follows package tests’ recorded npm version and leaves lock unchanged; optional import-map consolidation is deferred, not a new dependency. Sleep failure local diagnostic now records its actual sleep error as documented; HTTP category always safe. Adds2 colocated test files to existing folder cardinality warning, no new runtime concern/folder.

## Resume and current-main reconciliation (2026-10-31)

Adopted PR #2482 at 048bad37987ea86ee2fd67494c9ca96a04bcfcf4.
Main baseline is f89260ac9. The shallow checkout initially lacked a shared ancestor;
fetching deeper history restored the genuine merge base. Current main was merged,
retaining retryClock alongside listenerHealthyResetMs in the single options conflict.
Dispatcher/execution files match main byte-for-byte. No new design or acceptance
scope; PLAN2 PASS remains the pre-implementation plan authority.

Inspected `deno task agentic:matrix -- --tier feature --json`. Owner override,
verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate
session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed,
blockers only.” The existing evaluator session will be resumed through claude-print.
The feature matrix retains max2 plan/max5 implementation rounds; this continuation
uses implementation round2 after the precommit round1 PASS.

Read-only leak check: unrelated/unknown-owner Aspire processes left untouched;
Docker unavailable. No shared resource mutation. Isolated Redis proof is next.

Resumed positive suite after adapting Lua fault injection:111 PASS,0 FAIL,6 ignored
(conditional backend/CI-only coverage); both real-store #2400 cases execute. Reset
negative control now gives explicit budget-exhaustion assertions for both stores,
and the fake-clock spaced case fails on the cumulative count assertion. Burst
failures, capped backoff/Infinity, shutdown and credential-safe health remain green.
Typecheck136 and changed-source lint/fmt9 pass after the typed error addition;
quality/arch/deps passes again. Workers publish dry-run passes. Full doclint still
has the identical2 inherited private-type refs, changed /worker0; JSR audit has
no FAIL, only existing cardinality/banner warnings.

Independent round2 review accepted merge coexistence and required sanitizing the
newly generated leak report before staging. Raw diagnostics were copied privately;
the run file now has only a safe ownership summary. The reviewer did not independently
prove real Redis; its early acceptance of receipts preceded the discovered obsolete
ACL fault injection. That proof has since been repaired and rerun as described above.
Round3 reviews the final source repairs and generated freshness before commit.

Generated prose and export carriers refreshed through native tasks. Export generator
used its supported --allow-dirty preview because the main merge and reviewed source
repairs were pending. Their actual paths are in supervisor.md. No handcrafted payload.
Review thread4429709762 answered with the QueueError contract fix and regression proof.
Protected source files and deno.lock still match main. No labels/milestones changed.

Prose freshness, MCP export freshness, docs:accuracy, and repaired workers publish
all PASS via allowlisted durable runners. Generated corpus comparison to main changes
only plugin-workers /runtime and /worker rows; no unrelated package rows changed.
Review-thread gate PASS:1 answered,0 unanswered. Run privacy scan found no operator
paths, live host addresses or session identities. All source/proof fixes are ready
for the retained evaluator's round3 signoff.

## Resumed slice signoff and reconcile

Retained separate Opus5.5/high evaluator round3 PASS, substantive findings in
evaluate.md. It independently passed the export-corpus check and a structured
74PASS/0FAIL/17ignored worker-only suite without Redis; real-store proof remains
supervisor-run receipts, not falsely claimed independent reproduction. Prose
freshness already passed the supervisor's durable runner. Supervisor signs off
this merge plus bounded fixes for commit/push. Final exact-head evaluation will
be posted on PR2482 so no later evidence-only commit invalidates its reviewed SHA.

Reconcile: #2400 still open, PR2482 adopted, review4429709762 answered. Original
PLAN2 PASS retained, no duplicated PR or issue, no label/milestone changes.
Coordinator owns shared E2E and merge. After commit, run the corpus regression
that clones committed HEAD, then final review and READY handoff; any pending CI
or shared E2E remains explicitly unproven. No new architectural debt.
