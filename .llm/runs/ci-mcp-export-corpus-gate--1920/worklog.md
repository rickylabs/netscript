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

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Use `RUN_DENO` on the new step | Every generator input class is Deno-relevant; docs-only quality runs need not generate the corpus. | classifier + workflow |
| Preserve the existing catalog | #1920 is a missing workflow invocation, not a missing gate. | gate catalog |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Documented `rtk` executable is absent on this host | minor | yes |

## Gate Results

Results will be copied from `evidence.md` after implementation.

## Handoff Notes

- Supervisor should inspect the exact workflow step, determinism hashes/cardinalities, classifier
  derivation, throwaway-worktree RED, live-tree GREEN, and remote-main comparison.
- Tier-A slice review and separate-session IMPL-EVAL remain pending; this author will not mark the
  PR ready or merge it.
