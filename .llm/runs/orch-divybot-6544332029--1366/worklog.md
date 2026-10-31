# Worklog

## Authority

Owner override verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.” Rationale: owner-selected independent evaluation for this feature-tier carry-over. Implementation is owner-assigned Sol / high. Matrix queried and recorded in supervisor.md. No profiles/ file is read.

## Design

1. Public surface: existing @netscript/plugin/health; optional ChildHealthMonitorOptions with crashLoopThreshold; ChildRestartHistory / ChildRestartHistoryPort; FileChildRestartHistory; backwards-compatible third ChildHealthProcessOptions argument on runChildHealthProcess. Existing health snapshots and redaction unchanged.
2. Domain vocabulary: process history, active process, restart attempt, crash-loop threshold, latched crash loop and live recovery window. A restart is a new process replacing an unclean prior process; first startup and a clean stop/start do not count.
3. Ports: ChildRestartHistoryPort read/write seam, synchronous to persist admission and fatal transitions before OS termination; existing injected epoch-millisecond clock. Filesystem adapter is the only concrete new IO implementation.
4. Constants: CHILD_CRASH_LOOP_THRESHOLD stays 3 / 60_000; bounded history size and schema version live with the adapter; resource history paths are documented glue constants, separated per plugin.
5. Commit slices: S0 run/plan -> independent PLAN-EVAL; S1 contract, shared detection/persistence/transport, two glue stubs, subprocess tests/docs/canonical carriers -> scoped automated gates, negative control, independent implementation review; S2 only if review/CI requires correction. Every slice updates this file and context-pack.md.
6. Deferred scope: dashboard box 5, installed-consumer proof, distributed replicas, workers budget changes and fatal message changes; all belong to other work or already-delivered behavior.
7. Contributor path: packages/plugin/README.md explains threshold, options, persistence lifetime, ownership, extension seam, permission and failure behavior.

## Progress

- Bootstrap and research complete on current main; no duplicate implementation found.
- S0 ready for independent plan review; code not yet modified.
