# Worklog: #1730 provider-invisibility regression guard

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-ai-request-context-provider-guard--1730` |
| Branch | `test/ai-request-context-provider-guard` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `none` |

## Design

### Public Surface

- No public surface changes. Existing `RequestContext`, `ChatClientRequest`, `createAgentLoop`, and
  `withRetryingChatClient` contracts are exercised as published.

### Domain Vocabulary

- `RequestContext` — existing opaque application-state bag that must stay provider-invisible.
- `ChatClientRequest` — existing owned five-field turn request; four fields are provider-bound.
- `provider-bound payload` — test-only JSON projection of `messages`, `system`, `tools`, `options`.
- `attempt` — one inner provider stream call; a retry creates another attempt for the same turn.
- `continuation` — the loop turn after a tool result is appended to history.

### Ports

- `ChatModelProviderPort` — injected loop seam; the test supplies a local recording provider.
- `ChatClientPort` — inner seam wrapped by `withRetryingChatClient` so every attempt is observable.
- No new product port or shared test-support port.

### Constants

- `MODEL` — existing deterministic provider/model identifier.
- `SENTINEL` — replace with a high-entropy `ns1730` value used nowhere outside `CONTEXT`.
- `CONTEXT` — existing sentinel-bearing application bag.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| S1 | Lock research, plan, product ceiling, and base gate classification; open draft PR. | Baseline census + diff/PR review | Run directory |
| S2 | Add retry/continuation loop guard and demonstrate mutation B red then restored green. | Focused structured test wrapper | Test file + run artifacts |
| S3 | Rename/document Anthropic adapter-wire coverage. | Focused structured test wrapper | Test file + run artifacts |
| S4 | Land evidence-only artifact state, then create/audit exact-head receipts. | Receipt and Git hygiene audit | Run artifacts; ignored receipts |

### Deferred Scope

- Product behavior, public surface, adapter internals, existing doc-lint/JSR debt, docs, and release
  coordination are intentionally excluded.

### Contributor Path

Future provider-invisibility fields are added to `ChatClientRequest`; a contributor updates the
loop request projection in `request_context_test.ts` and proves its negative assertion red with a
temporary serialization mutation before merging.

## PLAN-EVAL

`PLAN-EVAL: N/A` — #1730 is a small mechanical regression-net leaf whose issue supplies the exact
mutation, field boundary, acceptance criteria, product ceiling, and gate constraints. All choices
that could force rework (field list, retry fixture, Anthropic treatment) are locked in `plan.md`.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-30T12:49Z | S1 | bootstrap | Confirmed clean non-shallow branch at `origin/main` `f8b4f804`; fetched issue #1730. |
| 2026-08-30T12:50Z | S1 | doctrine | Selected authoritative Archetype 4 / Keep verdict; locked test-only product ceiling. |
| 2026-08-30T12:54Z | S1 | baseline gates | Ran every candidate at base; doc-lint alone is pre-existing red and is contracted as a delta. |
| 2026-08-30T12:55Z | S1 | plan | Recorded design, locked decisions, four slices, risks, and exact provider-bound fields. |
| 2026-08-30T12:59Z | S1 | reconcile | Live `main` advanced to `952cc106`; verified no owned-surface overlap, rebased, and reran every base candidate in a detached clean worktree. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Exhaustive loop projection is `messages/system/tools/options`. | Those are all request fields except `context`. | `ChatClientRequest` docs/source |
| Record retry attempts below `withRetryingChatClient`. | Recording only provider creation or loop turns misses retries. | Provider retry implementation |
| Rename/document Anthropic test. | Adapter drops unknown model options; seam test owns mutation-A detection. | Issue #1730 + bridge/adapter code |
| No PLAN-EVAL. | Complete mechanical contract with no open decision. | Harness run-loop §4 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None | — | `drift.md` records no divergence |

## Gate Results

### Base candidate gates (before implementation)

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Focused tests | `run-deno-test.ts -- --allow-all packages/ai/tests/request_context_test.ts` | PASS | 9/9; exit 0; 1690 ms at `952cc106` |
| Full AI tests | `run-deno-test.ts -- --allow-all packages/ai/tests/` | PASS | 147/147; exit 0; 3615 ms at `952cc106` |
| Check | `run-deno-check.ts --root packages/ai --ext ts,tsx` | PASS | 100 selected; 0 diagnostics |
| Lint | `run-deno-lint.ts --root packages/ai --ext ts,tsx` | PASS | 100 selected; 0 findings |
| Format | `run-deno-fmt.ts --root packages/ai --ext ts,tsx` | PASS | 100 selected; 0 findings |
| Quality | `deno task quality:gate` | PASS | exit 0; existing repository warnings only |
| Doc lint | `deno task doc:lint --root packages/ai --pretty` | BASE RED | exit 1; 128 private refs; 0 missing JSDoc |
| JSR audit | `audit-jsr-package.ts --root packages/ai --text` | PASS | exit 0; 2 existing warnings |
| Publish | `deno publish --dry-run --allow-dirty` in `packages/ai` | PASS | exit 0; 3 existing dynamic-import warnings |

### Static Gates

| Gate | Result | Notes |
| --- | --- | --- |
| Final exact-head static gates | NOT_RUN | S4 |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-1–F-19 applicable no-regression set | NOT_RUN | S4 | Base classification above; no public surface planned. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Mutation B guard | NOT_RUN | S2 | Must record exact named red output and restored green. |
| Retry + continuation | NOT_RUN | S2 | Must cover every recorded request. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Public import consumers | N/A | No surface change | No builder/definition/export/subpath touched. |

## Reconcile Notes

- **S1:** Issue #1730 remains open with `type:test`, `area:ai-core`, `priority:p1`, one
  `status:research`, and milestone number 27. No new issue/PR comments existed at intake. The draft
  PR carries `Closes #1730`; no issue box is edited. Live `main` advanced once during PR creation;
  the branch was rebased and the base census repeated with unchanged classification.

## Handoff Notes

- Tier-A should inspect the exhaustive field list, retry recording level, base-red doc-lint delta,
  and product ceiling first.
- S2 must not start until the separate Tier-A supervisor records substantive approval of S1.
