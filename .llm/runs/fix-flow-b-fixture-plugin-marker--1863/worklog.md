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
| 2026-09-01 | 2 | GREEN | Product slice `142d8ede0`; identical focused test: exit 0, 3 passed / 0 failed. |
| 2026-09-01 | 2 | static gates | Evidence head `340afa724`; three-file structured check/lint/fmt all exit 0; `deno.lock` hash unchanged. |

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
  (`priority:p0`). A concurrent supervisor-owned commit, `142d8ede0`, landed the same staged
  three-file product slice; its history was preserved without rewrite, and every scoped wrapper was
  rerun at head `340afa724`. Hosted acceptance and separate-session evaluation remain pending.

## Handoff Notes

- Inspect `locate-workers-resource-block.ts` first: it requires unique workers creation and
  registration anchors, valid ordering, and exactly one resource creation/registration in the
  returned range.
- Separate-session IMPL-EVAL follows; this generator session does not self-certify.

## Convergence onto main b66e52cbc (orchestrator)

- Merged `origin/main` `b66e52cbc` into the leaf at `5cd4aa4a4`; merge commit `2e6a348bb`.
- Clean merge, no conflicts. All three leaf product paths verified **byte-identical** across the
  merge (`git rev-parse <sha>:<path>` compared before/after): the locator module, the fixture, and
  the test file. `deno.lock` unchanged by the merge.
- Tier-A re-run at the converged head: `packages/cli/e2e` unit suite **210 passed / 0 failed**;
  `deno lint` clean on all 3 touched files; `deno fmt --check` clean across 178 files.

### Cascade / generated-carrier checks at converged head

| Check | Exit |
|---|---|
| `check:agent-docs-prose` | 0 |
| `check:assets-barrel` | 0 |
| `check:publish-assets` | 0 |
| `check:mcp-export-corpus` | **1 — stale** |

`check:mcp-export-corpus` is **stale on clean `origin/main` `b66e52cbc` itself** — verified by
checking out main into a detached scratch worktree and running the check there in isolation
(exit 1). It is therefore **pre-existing and not caused by this leaf**, which touches only
`packages/cli/e2e` and changes no exported surface.

Deliberately **not** regenerated inside this leaf: regenerating a shared carrier here would sweep an
unrelated main-wide problem into a bounded p0 fix and make this diff dishonest about its own scope.
Recorded as a stop-and-report supervisor handoff.

### Runtime status

The `340afa724` host-lease receipt is **void for this head** and is not claimed. That head carried
only the plugins-side locator; the current head additionally rewrites the locator and migrates the
background consumer, which is product code the Flow-B fixture executes at runtime. Hosted exact-head
`scaffold.runtime` is required via the `gate:e2e` label.

## Hosted-runtime trigger: two blockers found (orchestrator, 2026-09-01)

Requested route was "hosted exact-head scaffold runtime through the `gate:e2e` label". Neither half
of that works as stated; both verified against `.github/workflows/e2e-cli.yml`, not assumed.

**1. `gate:e2e` is not a CI trigger.** It appears nowhere in `e2e-cli.yml`. The opt-in labels are
`e2e-cli-gate`, `desktop-native-gate`, and `ci:full` (`:31-32`, `:93-95`). `gate:e2e` is a taxonomy
label only. Every e2e-cli run on this branch so far — `63085cba8`, `5cd4aa4a4`, `8c9c02cc1` — concluded
**skipped**, confirming nothing was ever triggered.

Applied `ci:full` instead, which short-circuits `run_runtime` unconditionally (`:262`).
`e2e-cli-gate` alone would defer to `classify`, which may not select the runtime tier for an
e2e-only diff.

**2. The applicability gate excludes drafts.** `:91` — `github.event.pull_request.draft == false`.
Run `33479568723`, created by the `ci:full` labeled event at 06:53:27Z at exact head `8c9c02cc1`,
skipped **every** job including `classify`. The hosted runtime therefore **cannot** run while the PR
is a draft, whatever labels are applied.

### Consequent ordering constraint

Hosted exact-head runtime proof is only obtainable **after** the ready transition. The required order
is therefore:

1. independent evaluator verdict (manual dispatch — already running, label-independent);
2. apply `impl-eval:skip` **before** ready, so `openhands-phase-eval.yml` does not spawn a redundant
   evaluator on `ready_for_review`;
3. flip draft -> ready, which fires `e2e-cli.yml` with `ci:full` at the exact head;
4. verify a run actually **starts and is not skipped** — never infer from the label.

This does not weaken the runtime requirement: the earlier `340afa724` receipt remains void and
unclaimed, and merge still requires a green hosted `scaffold.runtime` at the final exact head.
