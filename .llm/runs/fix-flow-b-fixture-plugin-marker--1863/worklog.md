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
| 2026-09-01 | 1 | RED | Structured focused test: exit 1, 0 passed / 3 failed; test-only commit `1d045b04c`. |
| 2026-09-01 | 2 | GREEN | Identical focused test: exit 0, 3 passed / 0 failed. |
| 2026-09-01 | 2 | static gates | Three-file structured check/lint/fmt all exit 0; `deno.lock` hash unchanged. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Pair creation and registration anchors | It cannot silently select an ordinal or incomplete workers block. | Owner brief + generated code |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Sibling generator marker inconsistency deferred at the product ceiling. | minor | yes |
| `quality:scan --help` / `arch:check --help` executed their read-only task bodies rather than help-only output. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Focused RED | Structured test wrapper on `locate-workers-resource-block_test.ts` | EXPECTED FAIL | Exit 1; 0 passed / 3 failed before the locator existed. |
| Focused GREEN | Same structured test wrapper | PASS | Exit 0; 3 passed / 0 failed. |
| Check | Structured check wrapper, three owned TS files | PASS | 3 selected; 0 failed batches/diagnostics. |
| Lint | Structured lint wrapper, three owned TS files | PASS | 3 processed; 0 findings. |
| Format | Structured format wrapper, three owned TS files | PASS | 3 processed; 0 findings. |
| Diff hygiene | `git diff --check` | PASS | No whitespace errors. |
| Lock hygiene | baseline/current `git hash-object deno.lock` | PASS | Both `ac2ee042566bc6b03502c40961c10d624416b061`. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-10 | PASS | Focused three-case test; 91-line test file | Compact semantic fixture, no whole-output snapshot. |
| F-19 | PASS | Structured wrappers above | Scoped to the three owned TypeScript files. |
| `quality:scan` | PASS | Read-only task body, exit 0 | Supplemental repo-wide scan triggered while probing help; no findings and not used to widen scope. |
| `arch:check` | PASS | Read-only task body, exit 0 | Supplemental repo-wide doctrine scan; nested E2E remains non-published. |
| JSR/public surface | N/A | Research surface scan | No export, dependency, permission, or publish change. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `scaffold.runtime` | NOT_RUN | Owner constraint | No runtime lease; owner dispatches hosted proof. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Published CLI/JSR | N/A | Diff review | Fixture-only internal change. |

### Reconcile notes

- S0: Draft PR #1865 opened with `Closes #1863`, milestone 0.0.7, namespaced labels, and truthful
  unchecked hosted/evaluator DoD items.
- S1: RED commit pushed and PR phase comment posted with exact structured failure counts.
- S2: Issue #1863 taxonomy reconciled to exactly one `status:` (`status:impl`) and one priority
  (`priority:p0`); hosted acceptance and separate-session evaluation remain pending.

## Handoff Notes

- Inspect `locate-workers-resource-block.ts` first: it requires unique workers creation and
  registration anchors, valid ordering, and exactly one resource creation/registration in the
  returned range.
- Separate-session IMPL-EVAL follows; this generator session does not self-certify.
