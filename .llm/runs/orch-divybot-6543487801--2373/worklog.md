# Worklog

## Design

1. Public surface: same adapter contract registration; test-only completion assertions change.
2. Vocabulary: completion = iterator done with no batch; hang guard = generous failure deadline, never a latency target.
3. Ports: WatchableKv, AsyncIterator, AbortSignal, optional ready; @std/async deadline.
4. Constants: replace ABORT_BUDGET_MS with ABORT_TIMEOUT_MS (5 seconds); queue uses a named matching hang guard.
5. Commit slices: bootstrap (run artifacts, plan review); test correction (contract + queue test, scoped wrappers and stress); close evidence (run artifacts, evaluator).
6. Deferred scope: production behavior, unrelated elapsed-time tests, CLI E2E by explicit owner instruction.
7. Contributor path: packages/kv/src/testing/watchable-kv-contract.ts.

## Routing

Read feature routing through agentic:matrix --tier feature --json. Owner override, verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.” Implementation effort medium is also owner-requested.

## Bootstrap

Assignment read in full. Memory consulted; MCP guidance/search consulted. Baseline equals fetched main. No covering PR found. PLAN-EVAL pending; implementation has not begun.
