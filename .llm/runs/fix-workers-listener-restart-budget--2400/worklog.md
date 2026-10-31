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
