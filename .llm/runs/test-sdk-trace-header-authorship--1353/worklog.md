# Worklog: SDK trace-header authorship proof

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-sdk-trace-header-authorship--1353` |
| Branch | `test/sdk-trace-header-authorship` |
| Archetype | `2 — Integration` |
| Scope overlays | none |

## Design

### Public Surface

- No public-surface change. Existing `SdkClientContribution` and `createServiceClient` are inspected
  with `deno doc`; `createHttpClientLink` remains package-private.

### Domain Vocabulary

- Reserved trace declaration — contributor-owned `traceparent`/`tracestate` claim rejected during
  construction.
- Transport-authored trace — the final wire `traceparent` whose span ID matches the HTTP CLIENT span.
- Logical parent — active test span that parents every retry or reconnect transport attempt.

### Ports and constants

- No new port or production constant.
- Test sentinels model stale pre-injection trace data and two unrelated contributed headers.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Prove reserved-key rejection and composed retry/reconnect trace ownership. | Focused and full SDK wrapper tests | `packages/sdk/tests/client-contribution-validation_test.ts`, `packages/sdk/tests/client-contribution-observability_test.ts`, run artifacts |

### Deferred Scope

- Production changes and public trace APIs — neither justified by the audit and the latter prohibited.
- Supervisor review and separate-session IMPL-EVAL — outside this implementation-agent session.

### Contributor Path

Trace authorship is maintained in `src/client/http-client-link.ts`; contribution ownership is
validated in `src/internal/client-contributions/prepared-call.ts`; regression proofs are in the two
focused test files changed by this slice.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02 | 1 | baseline | Focused existing suites: 20 passed, 0 failed, 0 ignored. |
| 2026-09-02 | 1 | first run | Test harness type narrowing failed before TAP execution; no product behavior ran. |
| 2026-09-02 | 1 | focused proof | New focused suites: 14 passed, 0 failed, 0 ignored; no SDK source fix required. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Test-only touch set | Enforcement already exists; only proof gaps remain. | `research.md` audit table |
| No PLAN-EVAL | Amendment and brief fully lock scope and gates. | issue #1353 amendment / owner brief |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Historical migration proposal is reversed; main already ships most guarantees. | significant | yes |
| Generic harness draft-on-start conflicts with owner-required non-draft PR. | minor | yes |

## Gate Results

### Static and package gates

| Gate | Exit | Result | Notes |
| --- | ---: | --- | --- |
| SDK check wrapper | 0 | PASS | 101 files, 0 diagnostics |
| SDK lint wrapper | 0 | PASS | 101/101 files, 0 findings |
| SDK format wrapper | 0 | PASS | 101/101 files, 0 findings |
| Full SDK test wrapper | 0 | PASS | 223 passed, 0 failed, 0 ignored |
| `deno doc --lint` export-map wrapper, `origin/main` | 1 | BASELINE | 3 unique pre-existing `private-type-ref` diagnostics |
| `deno doc --lint` export-map wrapper, branch | 1 | DELTA PASS | Same 3 diagnostics; 0 new diagnostics |
| JSR package audit | 0 | PASS with warnings | Dry-run OK; pre-existing root cardinality and slow-type banner warnings |
| `deno publish --dry-run` from `packages/sdk` | 0 | PASS | Clean-tree rerun completed and printed the publish listing on stderr |
| `deno task quality:gate` | 0 | PASS | `quality:scan` findings 0; `arch:check` FAIL=0 (SDK carries one existing F-16 warning) |
| `deno task check:mcp-export-corpus` | 1 | BASELINE FAILURE | Branch and detached `origin/main` both report stale corpus; no export/source delta |
| `deno.lock` SHA-256 | 0 | PASS | Before/after `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d` |

### Runtime proof

| Guarantee | Result | Evidence |
| --- | --- | --- |
| Reserved trace declarations rejected | PASS | Explicit `traceparent`, `tracestate`, and `Traceparent` diagnostics identify each contribution ID |
| No double injection under two-contribution composition | PASS | Four wire attempts in both contribution orders each contain one `traceparent`; span ID matches the transport CLIENT span |
| Retry topology | PASS | Two retry CLIENT spans share the active retry-parent span and preserve both contributed headers |
| Reconnect topology | PASS | Two reconnect CLIENT spans share the active reconnect-parent span; preparation rotates once per reconnect epoch |

### Reconcile note

- Issue #1353 remains open for supervisor close-gate verification. This test-only slice references
  #1353 without a closing keyword and does not mutate the epic #1348. Separate-session IMPL-EVAL
  remains pending after push/PR creation.

## Handoff Notes

- Evaluator should inspect the traceparent-to-span-ID match and retry/reconnect parent assertions first.
- No implementation session may self-certify the slice; separate-session IMPL-EVAL remains pending.
