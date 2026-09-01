# Worklog: refresh the MCP export-surface corpus

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-mcp-export-corpus-refresh--1859` |
| Branch | `fix/mcp-export-corpus-refresh` |
| Archetype | `2 — Integration` |
| Scope overlays | `none` |

## Design

### Public Surface

- No MCP package public export changes. The internal embedded corpus mirrors workspace public
  exports for MCP discovery tools.

### Domain Vocabulary

- Existing corpus metadata (`sha256`, uncompressed/compressed byte counts) and compressed payload;
  no new types or interfaces.

### Ports

- Existing `ExportSurfaceCorpusPort`; no new or changed port.

### Constants

- Existing generator-emitted constants only; no hand-authored values.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Refresh the authoritative MCP export corpus | `deno task check:mcp-export-corpus` plus Tier-A | generated corpus + run artifacts |

### Deferred Scope

- SDK code, generator behavior, and CI gate wiring remain owned by separate decisions/issues.

### Contributor Path

When workspace public exports change, run `deno task gen:mcp-export-corpus` and verify freshness with
`deno task check:mcp-export-corpus`; never edit the generated payload manually.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-01 | 1 | RED | Exact base `78be0e032`; `check:mcp-export-corpus` emitted the stale-corpus error and `REAL_EXIT=1`. |
| 2026-09-01 | 1 | Plan gate | `PLAN-EVAL: N/A` — coordinator ruled this a mechanical regeneration with locked scope and gates. |
| 2026-09-01 | 1 | Generate | `gen:mcp-export-corpus` returned `0`; output metadata is SHA `f8cc689d…`, 2,177,211 uncompressed bytes, and 315,294 compressed bytes. |
| 2026-09-01 | 1 | Scope check | Raw status showed one product file; diff is exactly 4 insertions/4 deletions. |
| 2026-09-01 | 1 | GREEN | Identical freshness command returned `REAL_EXIT=0`. |
| 2026-09-01 | 1 | Tier-A review | Inspected the complete diff shape: generator-owned payload plus SHA and byte counts only; no SDK/source/generator/CI change and no hand edit. |
| 2026-09-01 | 1 | Reconcile | Issue #1859 remains the sole closing issue; draft PR must carry `Closes #1859`, `status:impl`, taxonomy labels, and milestone `0.0.7`. No plan adjustment or drift. |

## Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| Base RED | PASS | `deno task check:mcp-export-corpus` at `78be0e032`: `REAL_EXIT=1` with stale-corpus error |
| Head GREEN | PASS | identical command after generation: `REAL_EXIT=0` |
| Repo check | PASS | 2,995 files, 25 batches, `REAL_EXIT=0` |
| Repo test | PASS | 4,619 passed, 0 failed, 19 ignored, `REAL_EXIT=0` |
| Quality scan | PASS | no findings, allowance count unchanged at 7, `REAL_EXIT=0` |
| Architecture | PASS | `deno task arch:check`, `REAL_EXIT=0`; warnings are pre-existing debt |
| MCP JSR audit | PASS | `REAL_EXIT=0`; three pre-existing warnings, no new finding |
| Scoped lint | PASS | 116/116 files, 0 findings, `REAL_EXIT=0` |
| Scoped format | PASS | 116/116 files, 0 findings, `REAL_EXIT=0` |
| Assets barrel freshness | PASS | `deno task check:assets-barrel`, `REAL_EXIT=0` |
| Agent docs prose freshness | PASS | `deno task check:agent-docs-prose`, `REAL_EXIT=0` |
| Publish assets freshness | PASS | `deno task check:publish-assets`, `REAL_EXIT=0` |
| Lock hygiene | PASS | `git diff --exit-code -- deno.lock`, `REAL_EXIT=0` |

Post-gate raw status still contains only the authorized generated product file plus this run
directory. IMPL-EVAL was not run: the owner explicitly waived/retained the independent review and
instructed this session to stop after opening the draft PR.

## Handoff Notes

- Owner waived evaluation for this turn and owns independent review, ready transition, and exact CI.
- Diff review should compare the four generator-owned changed lines and confirm no source surface was
  edited to make the corpus pass.
