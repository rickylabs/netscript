# Worklog: wire the MCP export-corpus gate into CI

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `ci-mcp-export-corpus-gate--1920` |
| Branch | `ci/mcp-export-corpus-gate` |
| Archetype | `2 — Integration` (`packages/mcp`; generated internal asset only) |
| Scope overlays | `none` |

## Design

### Public Surface

- No exported function, package entry point, CLI command, or external contract changes.
- CI gains one invocation of the existing `mcp-export-corpus` gate.

### Domain Vocabulary

- Existing gate catalog ID `mcp-export-corpus`, invocation ID `quality-mcp-export-corpus`, and
  receipt path `.llm/tmp/gate-receipts/quality/mcp-export-corpus.json`.

### Ports

- Existing gate catalog/runner contract only; no new port or abstraction.

### Constants

- No code constants are introduced. The workflow repeats the existing catalog ID, invocation ID,
  and receipt path required by the CI runner interface.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Bootstrap the evidence-backed harness plan | artifact review | `.llm/runs/ci-mcp-export-corpus-gate--1920/**` |
| 2 | Prove deterministic corpus generation and wire its existing gate into CI | determinism, YAML parse, classifier reachability, RED/GREEN teeth, structured tooling check | generated corpus, `.github/workflows/ci.yml`, run artifacts |
| 3 | Integrate final main and re-establish the generated corpus/evidence at that exact SHA | regeneration hash/cardinalities, YAML parse, classifier reachability, RED/GREEN freshness, structured tooling check | integration commit, generated corpus, run artifacts |

### Deferred Scope

- Generator dirty-tree guard (#1867 F-3), unrelated gate/job changes, and any concurrent package
  surface edits remain separate work.

### Contributor Path

When a published package surface changes, regenerate with `deno task gen:mcp-export-corpus`.
The `quality` job then invokes the cataloged freshness check and uploads its JSON receipt with the
other quality receipts.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02 | 1 | Re-baseline | Clean branch at exact dispatched/base SHA `ec848e6b0334ec8fcd2bc66ba009305d35367b01`; workflow/catalog/classifier premise confirmed. |
| 2026-09-02 | 1 | Plan gate | `PLAN-EVAL: N/A` — mechanical two-file change with locked implementation, validation, and stop condition. |
| 2026-09-02 | 1 | Baseline RED | Exact pinned base returned `REAL_EXIT=1` with the expected stale-corpus diagnostic. |
| 2026-09-02 | 1 | Determinism | Two warm generations and one pristine-`DENO_DIR` generation all returned 0 and produced byte-identical output: file SHA `906827e5…`, payload SHA `749a692a…`, 272 subpaths, 7,803 symbols. |
| 2026-09-02 | 2 | CI wiring | Added the existing catalog gate to `quality` with `RUN_DENO`, invocation ID `quality-mcp-export-corpus`, and receipt `quality/mcp-export-corpus.json`. |
| 2026-09-02 | 2 | Trigger proof | Executed nine classifier decisions covering package/plugin source and manifests, root manifest/lock, generator/workflow code, and generated output; all selected `needsDeno`, `quality`, and `RUN_DENO`. |
| 2026-09-02 | 2 | Teeth | Detached throwaway worktree at stale base returned exit 1; the fresh live tree and exact catalog runner each returned exit 0. |
| 2026-09-02 | 2 | Static validation | Parsed YAML assertion returned 0; requested structured tools check selected 342 files/3 batches and returned 0. |
| 2026-09-02 | 2 | Reconcile | Draft PR #1929 is open with exact requested taxonomy/milestone. `origin/main` advanced to `37452f11f`; it changes both the classifier (#1905/#1917) and corpus (#1915), so planned integration slice 3 is required. |
| 2026-09-02 | 3 | Integrate | Merged exact `origin/main` SHA `37452f11f` without rebasing. The sole expected generated-corpus conflict was resolved by regeneration, producing merge `92ae7df42`. |
| 2026-09-02 | 3 | Final determinism | Integrated warm generation, warm repeat, and new pristine-`DENO_DIR` generation all exited 0 and were byte-identical: file SHA `21cfdee7…`, payload SHA `81d49c6c…`, 273 subpaths, 7,809 symbols. |
| 2026-09-02 | 3 | Final teeth | Detached current-main RED exited 1; integrated fresh check and catalog runner each exited 0. |
| 2026-09-02 | 3 | Final validation | YAML parse, nine-case classifier proof, structured tools check, lockfile assertion, and diff-scope assertion all exited 0. A final fetch confirmed `origin/main` had not moved. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Use `RUN_DENO` on the new step | Every generator input class is Deno-relevant; docs-only quality runs need not generate the corpus. | classifier + workflow |
| Preserve the existing catalog | #1920 is a missing workflow invocation, not a missing gate. | gate catalog |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Documented `rtk` executable is absent on this host | minor | yes |
| Environment GitHub token lacked workflow scope; stored authenticated CLI token used | minor | yes |

## Gate Results

### Static Gates

| Gate | Result | Notes |
| --- | --- | --- |
| Parsed CI YAML | PASS (`REAL_EXIT=0`) | Read back exact job, name, `if`, gate, ID, and receipt path. |
| Classifier reachability | PASS (`REAL_EXIT=0`) | Nine input classes all selected Deno-backed quality. |
| `.llm/tools` structured check | PASS (`REAL_EXIT=0`) | 342 files, 3 batches, 0 failed batches/findings. |

### Fitness / Consumer Gates

| Gate | Result | Notes |
| --- | --- | --- |
| Stale corpus RED | PASS (`REAL_EXIT=1`) | Detached throwaway worktree at dispatched stale base; expected diagnostic matched. |
| Fresh corpus GREEN | PASS (`REAL_EXIT=0`) | Live tree at dispatched surface state. |
| Catalog-runner invocation | PASS (`REAL_EXIT=0`) | Receipt outcome `PASS`, command `deno task check:mcp-export-corpus`. |
| Integrated current-main stale corpus RED | PASS (`REAL_EXIT=1`) | Detached throwaway worktree at `37452f11f`; expected diagnostic matched. |
| Integrated fresh corpus GREEN | PASS (`REAL_EXIT=0`) | File SHA `21cfdee7…`, payload SHA `81d49c6c…`, 273 subpaths, 7,809 symbols. |
| Integrated catalog-runner invocation | PASS (`REAL_EXIT=0`) | Receipt outcome `PASS`, child exit 0. |

### Runtime Gates

N/A — no runtime behavior changed. `deno task e2e:cli` is explicitly prohibited for this slice.

## Handoff Notes

- Supervisor should inspect the exact workflow step, final determinism hashes/cardinalities,
  classifier derivation, current-main throwaway-worktree RED, integrated-tree GREEN, and the
  main-integration merge.
- Tier-A slice review and separate-session IMPL-EVAL remain pending; this author will not mark the
  PR ready or merge it.
