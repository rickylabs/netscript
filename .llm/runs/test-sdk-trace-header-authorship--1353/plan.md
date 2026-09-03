# Plan: SDK trace-header authorship proof

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-sdk-trace-header-authorship--1353` |
| Branch | `test/sdk-trace-header-authorship` |
| Phase | `plan` |
| Target | `packages/sdk` tests |
| Archetype | `2 — Integration` |
| Scope overlays | none |

## Archetype and doctrine verdict

`packages/sdk` is explicitly Archetype 2 (Integration). The current doctrine verdict is **Keep**:
preserve discovery/client/cache adapter boundaries. A14 is primary: tests and publish gates preserve
the transport-owned trace boundary. A1/A2 prohibit an unnecessary trace contribution export.

## Goal

Fill only the proof gaps found by the audit: deterministic negative trace-key cases, two-contribution
wire authorship, and CLIENT-span topology over retry/reconnect.

## Scope

- Extend `client-contribution-validation_test.ts` with `traceparent`, `tracestate`, and mixed-case
  declaration rejection that identifies the descriptor.
- Extend `client-contribution-observability_test.ts` with two descriptor orders, exact-one final
  `traceparent`, stale-header replacement, retry/reconnect CLIENT spans, attributes, and parentage.
- Add harness evidence artifacts.

## Non-Scope

- No `packages/sdk/src/**` change unless a proof test exposes a real enforcement defect.
- No public export, trace contribution factory, locale/`accept-language`, safe/baseContract, HTTP
  method/GET dedupe, query-key algebra, Aspire, Docker, browser, or CLI E2E work.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D-1 | Keep final injection in `createHttpClientLink`. | Binding amendment and existing correct ownership. |
| D-2 | Add tests only. | Audit found proof gaps, not runtime enforcement gaps. |
| D-3 | Match each wire `traceparent` span ID to an exported CLIENT span and its active parent. | Proves authorship and topology directly. |
| D-4 | Exercise `[first, second]` on retry and `[second, first]` on reconnect. | Proves composition order does not affect trace ownership. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Production edit | safe to defer | Required only if a new proof test fails behaviorally; none has. |
| Trace propagation API migration | safe to defer | Prohibited by the amendment. |

## Commit slice

| # | What it proves | Gate | Files |
| --- | --- | --- | --- |
| 1 | Reserved trace declarations fail deterministically and composed retry/reconnect requests retain exactly one transport-authored CLIENT trace with correct parentage. | Focused tests, then the full requested SDK/JSR/export gates | Two SDK test files plus this run directory |

## Risk register

| Risk | Mitigation |
| --- | --- |
| OTEL globals interfere with parallel tests. | Keep setup in an isolated `deno eval` child process, following the existing test shape. |
| Stream reconnect fixture tests codec trivia instead of the SDK seam. | Use a real `createHttpClientLink` with valid oRPC SSE message/error events and assert SDK retry epoch behavior plus transport spans. |
| Existing doc-lint residue obscures the delta. | Measure identical command output A/B against a detached `origin/main` worktree. |
| Validation mutates `deno.lock`. | Record SHA-256 before/after and inspect Git diff. |

## Anti-patterns and debt

- Avoid AP-9 (new trace abstraction), AP-14 (surface forwarding), and AP-18 (giant snapshots).
- No architecture debt entry is created or changed.

## Validation plan

Run every gate listed in the owner brief, plus harness-required `quality:gate`, the package JSR
audit, and `arch:check`; do not run prohibited E2E/runtime infrastructure gates.

## PLAN-EVAL

**PLAN-EVAL: N/A.** The normative amendment supplies the contract, hard prohibitions, acceptance
conditions, touch ceiling, and exact gates. The audit reduced the implementation to one mechanical
test-only slice with no open architecture decision.

