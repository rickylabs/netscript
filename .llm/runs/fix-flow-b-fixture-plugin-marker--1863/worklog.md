# Worklog: Flow-B fixture workers anchor

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-flow-b-fixture-plugin-marker--1863` |
| Branch | `fix/flow-b-fixture-plugin-marker` |
| Archetype | `6 — CLI / Tooling` (nested E2E workspace) |
| Scope overlays | `none` |

## Design

### Public Surface

- No published surface changes.
- Fixture-internal `locateWorkersResourceBlock(source)` returns the exact semantic source range used
  by `prepare-flow-b-fixture.ts`.

### Domain Vocabulary

- `SourceRange` — half-open `[start, end)` byte offsets for the workers resource block.
- Workers creation anchor — `builder.addExecutable(...workers-api...)` assigned to `resource`.
- Workers registration anchor — `plugins.set(...workers-api..., resource)`.

### Ports

- None. The locator is pure string policy with no external dependency.

### Constants

- Workers resource identity is local to the locator as `workers-api`; no new global vocabulary.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Bootstrap the bounded harness plan and ceiling. | Artifact review | `.llm/runs/fix-flow-b-fixture-plugin-marker--1863/*` |
| 1 | RED: specify current-format acceptance and absent/malformed rejection. | Focused structured test wrapper (expected RED) | Focused locator test only; run artifacts updated after evidence |
| 2 | GREEN: locate the unique semantic workers range and integrate it into Flow-B preparation. | Focused test + scoped structured static wrappers | Fixture, locator, focused test, run artifacts |

### Deferred Scope

- Generator-family marker consistency guard — generator-owned source/test change needs explicit
  rescope and is unnecessary for the semantic fixture fix.
- Runtime scaffold proof — owner dispatches hosted work; the lease is not held here.

### Contributor Path

Read the focused locator test first, then the locator, then its single call site in
`prepare-flow-b-fixture.ts`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-01 | 0 | plan | Ceiling and semantic two-anchor range locked; PLAN-EVAL N/A. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Pair creation and registration anchors | It cannot silently select an ordinal or incomplete workers block. | Owner brief + generated code |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Sibling generator marker inconsistency deferred at the product ceiling. | minor | yes |

## Gate Results

Pending implementation.

## Handoff Notes

- Separate-session IMPL-EVAL follows; this generator session does not self-certify.
