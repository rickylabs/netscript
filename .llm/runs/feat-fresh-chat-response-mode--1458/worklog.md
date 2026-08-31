# Worklog: #1458 typed chat-response completion mode

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-fresh-chat-response-mode--1458` |
| Branch | `feat/fresh-ai-chat-response-mode` |
| Archetype | `4 — Public DSL / Builder` (assigned to `packages/fresh`) |
| Scope overlays | none; no route, UI, or browser workflow changes |

## Design

Recorded before implementation on 2026-08-31. **PLAN-EVAL: N/A** because the issue, research, and
locked plan fully specify the upstream-exact fields, forwarding path, behavior, ceiling, and gates;
no architecture or sequencing decision remains open.

### Public Surface

- `NetScriptChatResponseOptions` — widen the existing exported options interface with optional
  `mode` and `waitUntil` fields matching the pinned transport.
- `toNetScriptChatResponse` — preserve authorization and default behavior while forwarding the two
  options to either the default transport adapter or a custom `toResponse` adapter.

### Domain Vocabulary

- `mode?: 'immediate' | 'await'` — transport completion policy; omission remains meaningful.
- `waitUntil?: (task: Promise<unknown>) => void` — host background-task registration callback.

### Ports

- `toResponse` — existing consumer-replaceable response adapter seam; its input must receive both
  new options so substitution does not erase behavior.
- `toDurableChatSessionResponse` — pinned upstream transport boundary used by `defaultToResponse`.

### Constants

- None. The upstream-exact two-member union is kept inline as required; no new abstraction or
  default constant is justified.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove typed completion options reach custom and real transport paths without changing omission semantics | scoped Fresh check/lint/fmt; focused test; `docs:exports-drift`; lock hash | `packages/fresh/src/runtime/ai/create-chat-connection.ts`, `packages/fresh/src/runtime/ai/create-chat-connection_test.ts` |

### Deferred Scope

- Dependency changes, read paths, live subscriptions, snapshot resolution, and connection creation
  are excluded by the issue and locked plan.
- Browser, Aspire, Docker, and CLI E2E validation are excluded because the lane owns no runtime
  lease and this response-helper slice changes no browser workflow or scaffold surface.

### Contributor Path

Start at `NetScriptChatResponseOptions`, follow `toNetScriptChatResponse` into the `toResponse`
input, then follow `defaultToResponse` into `toDurableChatSessionResponse`; copy the neighboring
seam-capture tests for future transport options and add real-path behavior coverage when semantics
depend on the upstream implementation.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-31 | 1 | design | Baseline verified; research/plan/issue/doctrine read; implementation not yet started. |
| 2026-08-31 | 1 | implement | Added the upstream-exact fields and forwarded them through both adapter paths; added seam and real-transport tests. |
| 2026-08-31 | 1 | gate | Focused tests and all scoped Tier-A checks passed; lock remained byte-identical. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Pass `undefined` through for omitted `mode` | Preserves the transport-owned default and custom-seam observability | `plan.md` LD-4 |
| Keep upstream field names and types verbatim | Avoids an unnecessary NetScript-specific translation layer | issue #1458; `research.md` |
| Exercise throwing sources through the real default adapter | Failure propagation is the behavior under change, not merely a type-seam claim | issue #1458 Expected |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Owner-directed no-reviewer stop leaves separate-session IMPL-EVAL unstarted | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Fresh check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx` | PASS | direct wrapper bypassed task cache; 200 files, 2 batches, 0 findings |
| Focused test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/fresh/src/runtime/ai/create-chat-connection_test.ts` | PASS | 18 passed, 0 failed, 1042 ms |
| Fresh lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx` | PASS | direct wrapper; 200/200 files, 0 findings |
| Fresh fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | PASS | direct wrapper; 200/200 files, 0 findings |
| Export drift | `deno task docs:exports-drift` | PASS | `Exports & Symbols drift check: PASS` |
| Lock hygiene | SHA-256 and `git diff --exit-code -- deno.lock` | PASS | unchanged `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Public contract / failure semantics | PASS | focused source and test review | no default injected; exact union/callback types; no new cast or lint suppression |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Real transport mode behavior | PASS | focused test: real pinned transport against local protocol stub | awaited success `200`; awaited mid-stream failure rejects; omitted mode with same failure resolves `202` and registers background task |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Custom `toResponse` adapter | PASS | seam-capture tests | supplied values forwarded by identity; omission observed as `undefined` |

## Handoff Notes

- Inspect omission semantics first: `input.mode` must remain `undefined` when the option is absent.
- Confirm real transport tests distinguish awaited rejection from immediate `202` success.
- Post-slice reconcile: issue #1458 remains open; this bounded PR fully resolves it and therefore
  requires `Fixes #1458`. No new comments or scope changes were present at the implementation sweep.
