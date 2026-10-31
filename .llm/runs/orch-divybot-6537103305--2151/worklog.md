# Worklog

## Design

1. Public surface: createWatcher strategy/native fail-closed diagnostics; WatchersFileWatcherAdapter lifecycle callbacks and retry; TriggerHealthMonitor snapshot served by existing child /health.
2. Domain vocabulary: watch health `watching | unavailable`; lifecycle failure/recovery events identify the trigger, time and state; file events remain create/modify/remove; strategy native/polling/hybrid.
3. Ports: existing FileWatcherPort, injected watcherFactory and clock; abortable platform delay in IO adapter; existing child health snapshot provider and telemetry logger. No speculative port.
4. Constants: named bounded retry initial/max delay; named lifecycle state/event constants; existing strategy vocabulary reused.
5. Commit slices: S1 recovery/readiness/root-loss + processor hooks; S2 health monitor/runtime/glue; S3 native strategy/error diagnostics/docs. See plan for exact touched surfaces and proving gates. Every slice updates this file and context-pack.
6. Deferred scope: downtime replay, event/dedup keys, global health storage, releases, full local scaffold runtime; owner coordinator retains these responsibilities.
7. Contributor path: adapter file explains retry and lifecycle, TriggerHealthMonitor explains public watch health, docs/site/reference/watchers/index.md explains strategies. Existing package folders remain unchanged.

Lifecycle: unavailable until ready; watching -> unavailable on watch failure; bounded retries -> watching after resource acquisition; stopped/unwatched terminal via abort. Per-trigger serial delivery, parallel independent registrations. Best-effort file detection; no promise to replay outage changes. Injected now records diagnostic time. Callback errors are isolated.

## Routing and owner override

Feature matrix resolved as JSON. Owner explicitly requests: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.” This overrides normal evaluator model selection, with distinct vendor/session retained. The evaluator gets read-only tools only. PLAN max 2, IMPL max 5; preserve context across rounds. Operator-specific Refs-only, no-label, no-local-E2E, and public privacy rules override generic assignment boilerplate.

## Bootstrap

Read assignment in full, issue and comments, skills and doctrine, consulted prior memory and NetScript MCP. Baseline main current. Real native root-removal probe confirmed remove event rather than iterator throw. PLAN-EVAL pending; no implementation yet.
