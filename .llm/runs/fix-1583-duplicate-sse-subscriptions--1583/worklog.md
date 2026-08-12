# Worklog: #1583 durable chat subscription ownership

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1583-duplicate-sse-subscriptions--1583` |
| Branch | `fix/1583-duplicate-sse-subscriptions` |
| Archetype | `4 - Public DSL / Builder`, with runtime gates |
| Scope overlays | `frontend` |

## Design

### Public Surface

- `createNetScriptChatConnection(options): NetScriptChatConnection` — unchanged.
- `NetScriptChatConnection.subscribe(signal?)` — unchanged signature; gains one-upstream multicast ownership.
- `close` / `stop` / `dispose` — unchanged aliases; abort the physical shared request.

### Domain Vocabulary

- **active pump** — the sole upstream `subscribeWithRetry` iteration owned by one connection handle.
- **logical subscriber** — one caller iterator receiving future chunks from the active pump.
- **retirement** — abort and completion of an active pump before a later pump may open.
- Lifecycle: `idle -> active -> retiring -> idle`, or any live state to terminal `disposed`.

### Ports

- Existing `UpstreamChatConnection` remains the transport seam. No new port or published type.
- `AbortSignal` remains the cancellation primitive for caller, shared pump, and connection teardown.

### Constants

- None. The change introduces no finite string vocabulary or timing policy.

### Commit Slices

| # | Slice | Gate | Files |
| - | - | - | - |
| 1 | Lock research, mechanism, design, and draft PR surface | plan checklist/manual citations | run artifacts |
| 2 | Add RED lifecycle/concurrency regression tests | `deno task --cwd packages/fresh test` (expected focused failures) | `create-chat-connection_test.ts`, run artifacts |
| 3 | Implement single-upstream ownership and prove all gates | prescribed static/package/docs/quality gates | `create-chat-connection.ts`, run artifacts |
| 4 | Separate-session IMPL-EVAL and final evidence update | evaluator protocol | `evaluate.md`, run artifacts, PR comment |

### Deferred Scope

- Full TanStack `UIMessage`/forwarded-data fidelity — a separate published-contract change named in issue #1583.
- External EIS browser replay — consumer source and app runtime are not in this checkout.

### Contributor Path

Read `createNetScriptChatConnection` for handle lifecycle, then the adjacent subscription-ownership helpers and their three lifecycle tests. Preserve `subscribeWithRetry` as the only upstream loop when extending retry behavior.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-12 | 1 | research/design | Pinned Preact effect and ChatClient dedupe verified; NetScript handle has no active-owner guard. |
| 2026-08-12 | 2 | RED tests | Required package task exited 1: 227 passed, exactly the three new physical-subscription tests failed. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Handle-level multicast | Structural one-upstream guarantee without caller or public API changes | `research.md`, D1 |
| PLAN-EVAL N/A | Focused fix with all material choices locked and prescribed gates | `plan.md` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Issue body has no acceptance checkboxes although brief requires `box-index` mapping | minor | yes |

## Gate Results

### RED evidence (before production change)

Command: `deno task --cwd packages/fresh test`

```text
one mounted chat connection shares one live request across repeated subscribe attempts ... FAILED
  Actual 2 / Expected 1 (create-chat-connection_test.ts:339)

stop aborts the one physically in-flight shared live request ... FAILED
  Actual 2 / Expected 1 (create-chat-connection_test.ts:366)

re-subscribing after every prior subscriber explicitly stops opens a fresh request ... FAILED
  Actual 3 / Expected 2 (create-chat-connection_test.ts:403)

FAILED | 227 passed | 3 failed (15s)
error: Test failed
```

Each failure is causal to the missing ownership guard: two concurrent logical consumers opened two physical upstream iterators; teardown therefore aborted two physical requests; the later legitimate subscription was the third upstream call instead of the second.

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Package tests (RED) | `deno task --cwd packages/fresh test` | EXPECTED_FAIL | 227 existing tests passed; all three new tests failed. |

## Handoff Notes

- Evaluator should inspect subscription acquisition/retirement races and confirm all three new tests fail on the parent baseline.
