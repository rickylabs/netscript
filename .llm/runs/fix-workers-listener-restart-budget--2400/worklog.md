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
