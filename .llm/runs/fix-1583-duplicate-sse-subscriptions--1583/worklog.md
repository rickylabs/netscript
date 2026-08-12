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
| 3 | Implement single-upstream ownership and prove all gates | prescribed static/package/docs/quality gates | `src/internal/chat-subscription-hub.ts`, `create-chat-connection.ts`, run artifacts |
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
| 2026-08-12 | 3 | implementation | Added one per-handle multicast hub; caller abort detaches one logical consumer, last detach retires the pump, and connection teardown aborts the physical request. |
| 2026-08-12 | 3 | slice review | Reviewed acquisition/retirement races, terminal error delivery, lifetime abort, export reachability, forbidden paths, public-surface delta, and lock hygiene. No new surface, casts, lint suppressions, dependency changes, or sibling-tree edits. |
| 2026-08-12 | 3 | reconcile | #1583 remains open with the three acceptance boxes and required labels/milestone; draft PR #1593 remains `status:impl`. No new review comments required scope adjustment. |
| 2026-08-12 | 4 | fallback IMPL-EVAL | PR comment `#issuecomment-5269616340` returned `FAIL_FIX`: implementation accepted; one blocking gap was missing concurrent value/error fan-out coverage. C2 required documenting suffix-only mid-stream joins. |
| 2026-08-12 | 5 | correction design | Keep behavior fixed. Add an emitting physical-stream probe, assert two concurrent logical collectors see identical values + `done`, assert the same upstream error reaches both, and document no-replay late joins on internal/public surfaces. |
| 2026-08-12 | 5 | RED correction | With `create-chat-connection.ts` temporarily restored to pre-hub `07cb3fd76`, package task exited 1: 227 passed / 5 failed. Both new tests failed independently at physical count `Actual 2 / Expected 1`; accepted implementation was then restored. |
| 2026-08-12 | 5 | final gates | Restored accepted implementation: scoped check/lint/fmt all exit 0 with zero findings; package task exits 0 at 232 passed / 0 failed. |
| 2026-08-12 | 5 | reconcile | Read the fallback IMPL-EVAL comment first; limited correction to C1/C2. PR remains draft and `status:impl`; no evaluator or OpenHands trigger was launched for this cycle. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Handle-level multicast | Structural one-upstream guarantee without caller or public API changes | `research.md`, D1 |
| PLAN-EVAL N/A | Focused fix with all material choices locked and prescribed gates | `plan.md` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Issue body has no acceptance checkboxes although brief requires `box-index` mapping | minor | yes |
| Full Fresh doc-lint has 44 diagnostics outside `./ai` despite the expected zero-diagnostic package bar | significant | yes |

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
| Check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx` | PASS (0) | 189 files, 2 batches, 0 failed batches, 0 occurrences. |
| Lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx` | PASS (0) | Final retry: 189 files, 1 batch, 0 occurrences. The first implementation run found three `require-yield` diagnostics in test-only held generators; fixed without suppression. |
| Format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | PASS (0) | 189 files, 1 batch, 0 findings. |
| Package tests (GREEN) | `deno task --cwd packages/fresh test` | PASS (0) | `ok | 230 passed | 0 failed (10s)`; existing integration test green. |
| Doc lint | `deno task doc:lint --root packages/fresh --pretty` | COMMAND_PASS_WITH_RESIDUE (0) | `./ai` entrypoints: 0. Full package: 44 pre-existing diagnostics (query 8, route 25, streams 11), all outside changed files. |
| Fresh target quality | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/fresh/src` | PASS (0) | `"ok":true`, zero findings, one existing route-support allowance. This is the explicit package verdict because root `quality:scan` does not scan Fresh. |
| Repository quality gate | `deno task quality:gate` | PASS (0) | Root quality scan clean; doctrine scan has `FAIL=0` for Fresh. Existing warnings remain: changed file 605 lines (improved from 684), route manifest 604, runtime/ai 13 children. |

### Final regression evidence

```text
one mounted chat connection shares one live request across repeated subscribe attempts ... ok
stop aborts the one physically in-flight shared live request ... ok
re-subscribing after every prior subscriber explicitly stops opens a fresh request ... ok
durable chat lifecycle provides seed, optimism, live tokens, reload resume,
multi-tab convergence, and multibyte fidelity ... ok

ok | 230 passed | 0 failed (10s)
```

### Correction-cycle RED evidence (without hub wiring)

Command: `deno task --cwd packages/fresh test` with `create-chat-connection.ts` temporarily at `07cb3fd76` and cycle-2 tests present.

```text
concurrent subscribers receive identical values and terminal from one physical subscription ... FAILED
  Actual 2 / Expected 1 (create-chat-connection_test.ts:460)

upstream error reaches both concurrent subscribers from one physical subscription ... FAILED
  Actual 2 / Expected 1 (create-chat-connection_test.ts:485)

FAILED | 227 passed | 5 failed (14s)
error: Test failed
```

The other three failures are the original cycle's expected no-hub regressions. The emitting probe broadcasts into every physical iterable, so without the hub both logical collectors still receive the controlled values/error; each new test fails specifically because two physical subscriptions open. With the hub, the same assertions additionally guard value multicast, terminal `done`, wake-up, and error fan-out.

### Correction-cycle final gates

| Gate | Result | Verbatim summary |
| --- | --- | --- |
| Check | PASS (0) | `{"filesSelected":189,"batches":2,"failedBatches":0}`; `"totalOccurrences":0` |
| Lint | PASS (0) | `{"filesSelected":189,"batches":1}`; `"totalOccurrences":0` |
| Format | PASS (0) | `{"filesSelected":189,"batches":1,"failedBatches":0,"findings":0,"ignoredFindings":0}` |
| Package tests | PASS (0) | `ok | 232 passed | 0 failed (14s)` |

### Lock and scope checks

- `git diff -- deno.lock`: empty; no dependency was added.
- No changed path is under `packages/fresh/src/application/defer/**` or `define-page/**`.
- `packages/fresh/src/runtime/ai/mod.ts` is unchanged; the hub is reachable only through the existing published factory.
- `create-chat-connection.ts` is 605 doctrine-counted lines versus 684 on the parent, so the slice improves rather than deepens its existing F-1 warning.

## Handoff Notes

- Evaluator should inspect subscription acquisition/retirement races, confirm all three new tests fail on the parent baseline, and treat the unrelated 44-item Fresh doc-lint residue explicitly rather than as changed-surface evidence.
