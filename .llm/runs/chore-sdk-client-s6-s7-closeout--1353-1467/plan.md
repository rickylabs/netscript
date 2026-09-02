# Plan: SDK client S6/S7 closeout

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-sdk-client-s6-s7-closeout--1353-1467` |
| Branch | `chore/sdk-client-s6-s7-closeout` |
| Phase | `plan` |
| Target | `packages/sdk` verification plus harness evidence |
| Archetype | `2 — Integration` |
| Scope overlays | `docs` |

## Goal

Classify all fourteen live acceptance rows against merged main, repair only the small trace-disable
residual proven by the audit, run the owner-selected gates, and open one closeout PR with closing
keywords/evidence blocks only for fully satisfied issues.

## Locked decisions

1. Apply #1353's amendment, not its superseded trace-contribution proposal.
2. Keep final trace injection in `createHttpClientLink`; gate only that injection with the existing
   `propagateTraceContext` switch.
3. Strengthen the existing observability proof so disabled propagation emits no trace headers and
   auth-shaped contribution data composes in both tuple orders.
4. Add no public symbols and make no locale behavior changes.
5. Use one `acceptance-evidence` block per fully shipped issue, with one-based `box-index` entries.

## Open-decision sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Trace-disable semantics | Resolved now | The issue's negative acceptance sentence is explicit. |
| Closing keywords | Resolved after gates | All seven rows for an issue must be shipped. |
| PLAN-EVAL | N/A | Fixed contract and owner-directed verification slice. |

## Commit slice

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Reconcile all fourteen rows, make the trace switch govern final injection, prove disabled/both-order auth composition, and record close evidence. | Owner gate set and mirror dry-run | `packages/sdk/src/client/http-client-link.ts`, `packages/sdk/tests/client-contribution-observability_test.ts`, run artifacts |

## Risk register

| Risk | Mitigation |
| --- | --- |
| Disabling propagation accidentally removes the CLIENT span | Keep `withSpan()` unconditional; gate only `injectContext()`/header mutation. |
| Evidence overclaims a compound row | Map every clause to a named symbol and test; classify partial if any clause lacks proof. |
| Locale behavior regresses | Run locale/cache focused tests and full scoped SDK check. |
| Generated carrier drift | Run `check:mcp-export-corpus`; do not regenerate unless the gate proves drift. |
| Lock churn | Hash and diff `deno.lock` before and after all gates. |

## Validation plan

1. Scoped SDK check wrapper.
2. Focused SDK tests with exact counts covering trace, contribution validation, locale, cache keys,
   retry/cancellation, and type fixtures through the scoped check.
3. `docs:readme-fences`, `docs:jsdoc-examples`, and `check:mcp-export-corpus`.
4. SDK publish dry-run as evidence for #1353 box 7.
5. Lock hash/diff and explicit-refspec push.
6. Open non-draft PR with all required metadata, then run the mirror dry-run.

## Non-scope

- Trace contribution factory, transport relocation, plugin/scaffold/Aspire/Docker/browser/E2E work.
- Issue edits, checkbox mutation, issue comments, or `status:ready-merge`.
- Locale API or cache-law changes.

## Drift / debt

- No architecture debt expected. Any broader behavior change or failing unrelated gate triggers
  rescope rather than opportunistic repair.
