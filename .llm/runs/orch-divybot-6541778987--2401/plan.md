# Plan & Design — READY FOR REVIEW

Issue #2401, milestone 0.0.9 / E1; feature tier, leaf profile. Baseline equals fetched local main at bootstrap.

## Locked design

Archetype 6 CLI/Tooling, containing a lifecycle adapter concern. Extend the existing `AspireCommandExecutor` seam with a cancellable, owned line stream. The production adapter spawns one `aspire describe <exact-resource> --follow --format Json --apphost <exact-path>` process for a database compatibility operation. It decodes chunked UTF-8/NDJSON incrementally; stderr is drained with bounded retention. Iterator completion, malformed output, EOF, timeout, cancellation, and early return must terminate and reap the follower. Never retry by polling or silently reconnect to another AppHost.

The database runner spawns its resource-scoped follower and consumes the initial matching snapshot BEFORE issuing resource start, all within one operation deadline. It ignores that baseline (including any prior terminal exit). After start it requires a nonterminal update before accepting a terminal update with numeric exit code. The already-connected stream buffers a fast start→terminal sequence during the start command. If no fresh nonterminal update appears it fails closed at the deadline; it never accepts a prior completion. Regression fixtures cover a stale prior terminal followed by a new run and a fast run completing immediately after the initial snapshot. The runner preserves exact resource/type matching, terminal-state/exit-code validation, the operation deadline, signal handling, resource stop, request-file removal, and resident-versus-standalone ownership. One-shot ps, wait, resource commands and logs remain bounded per operation. Multi-database operations are sequential; no concurrent follower is opened for an AppHost.

Existing generated readiness probes use direct listener checks; generated dev delegates lifecycle to Aspire. MCP/doctor discovery is one-shot per explicit invocation, not an autonomously scheduled loop. Existing E2E transition followers stay on their established adapter; finite stage snapshots are inventoried rather than rewritten.

No new package export, dependency, SDK/version upgrade, or schema migration. JSR rubric: existing export map and typed public entrypoints unchanged; added adapter contracts have explicit types and doc comments. Audit the affected CLI package; slow-type risk limited to explicit internal async iterable signatures.

## Slices

1. Bootstrap plan, inventory, upstream research, and draft PR; gate independent PLAN-EVAL PASS before source edits.
2. One cohesive implementation slice: `aspire-command-executor.ts`, a colocated line-stream adapter if justified, `operation-runner.ts`, focused executor/runner tests; Aspire reference doc; polling guard/test only if needed to extend existing coverage. Gate structured check/test/lint/fmt; negative control restores the old wait/start polling methods and must fail the runner test `one follow stream spans simulated minutes without snapshot polls` (one stream, zero snapshot describe calls); root quality:gate plus applicable Aspire static guards; CLI JSR audit. Independent IMPL-EVAL reviews source and evidence before signoff. Run context/worklog included in commit.
3. Evidence/handoff slice if necessary: run records and PR body; review threads, final exact-pushed-head IMPL-EVAL; coordinator-owned scaffold.runtime CI required. No local E2E.

## Risks and mitigations

- Follow records differ from snapshot JSON: use recorded 13.5.3 fixtures and strict resource identity/type filtering.
- Streams can hang: enforce a total deadline, abort process, close pipes, await status; test quiet timeout/cancellation and early completion.
- Stderr backpressure or huge lines: drain concurrently, cap diagnostic/line buffers, test chunk splitting and failed child.
- Follow can report a previous terminal state: lock initial-snapshot barrier before resource start, then require a fresh nonterminal transition; buffer ordered stream bytes during the start command. A terminal-only ambiguous run times out rather than certifying stale success.
- Reaping controls use fake CLI children for early return, quiet timeout, owner abort and malformed input: assert child killed/reaped, stderr drained, and a SIGTERM-ignoring child force-killed after a named bounded grace interval. Root gate baseline failures must be recorded accurately and compared with main without editing unrelated code.

## Deferred scope / decisions

Upstream fix and Aspire upgrade excluded by owner; document source cause and owner-ready report if no matching issue exists. No open rework-forcing decision remains: initial snapshot barrier and fresh nonterminal transition are required before accepting completion. Consumer/background paths discovered later enter inventory and explicit drift before source edits. Coordinator owns expensive scaffold.runtime check and merge; readiness is not a merge certification.
