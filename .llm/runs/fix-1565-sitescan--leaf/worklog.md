# Worklog: #1565 snippet walker

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1565-sitescan--leaf` |
| Branch | `fix/1565-snippet-gate-build-output` |
| Archetype | N/A — repository docs tooling |
| Scope overlays | docs |

## Design

### Public Surface

- `analyzeSnippetSite()` retains its existing contract and census.

### Domain Vocabulary

- generated/ignored directory — a directory that must not enter the source-page census.

### Ports

- `Deno.readDir` walks source; `git check-ignore --quiet` supplies repository ignore policy when available.

### Constants

- `_site` — stable Lume build-output fallback independent of Git.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Exclude ignored/generated directories without changing coverage; retain workflow order invariant | requested docs/snippet, scoped, link/accuracy, and repo gates | `.llm/tools/docs/snippet-policy.ts`, snippet/workflow tests, run artifacts |

### Deferred Scope

- All user-listed boundaries; evaluator and ready/merge lifecycle remain orchestrator-owned.

### Contributor Path

Extend directory-walk behavior in `snippet-policy.ts`, add corpus behavior to `snippet-extractor_test.ts`, and preserve the census ratchet.

PLAN-EVAL: N/A — small deterministic correction with a complete owner-provided contract and no open decision.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-12 | 1 | baseline | Clean census matched dispatch byte-for-byte. |
| 2026-08-12 | 1 | implementation | Added `_site` fallback, Git-ignore directory checks, recurrence diagnostic, and regression test. |
| 2026-08-12 | 1 | negative controls | Built-output exit 0 with unchanged census; source-page throwaway commit exit 1 and reverted. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Combine explicit `_site` fallback with Git ignore checks | Correct without Git while preventing future ignored-output recurrence | #1565 acceptance |
| Do not edit Pages workflow test | Required order assertion already exists at baseline | `pages-workflow_test.ts` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Pages step-order assertion pre-existed at dispatch baseline | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Clean census | `rtk proxy deno task docs:snippets` | PASS / exit 0 | `scanned=578 ts=211 tsx=77 typescript=7 ts_like=295 tier1=35 checked=21 exempt=14 outside_floor=260 malformed=0` before and after. |
| Snippet tests | `rtk proxy deno task docs:snippets:test` | PASS / exit 0 | 11 passed, including Pages order and `_site` regression. |
| Check | scoped `run-deno-check.ts --root .llm/tools/docs --ext ts,tsx` | PASS / exit 0 | 22 files, 0 findings. |
| Lint | scoped `run-deno-lint.ts --root .llm/tools/docs --ext ts,tsx` | PASS / exit 0 | 22 files, 0 findings. |
| Format | scoped `run-deno-fmt.ts --root .llm/tools/docs --ext ts,tsx` | PASS / exit 0 | 22 files, 0 findings. |
| Docs links | `rtk proxy deno task docs:links` | PASS / exit 0 | 102 docs, 0 broken links/anchors/orphans. |
| Docs accuracy | `rtk proxy deno task docs:accuracy` | PASS / exit 0 | Published-source and claim checks green. |
| Repository tests | `rtk proxy deno task test` | PASS / exit 0 | 3245 passed (622 steps), 0 failed, 17 ignored. |

### Negative and Green Controls

| Control | Result | Evidence |
| --- | --- | --- |
| Fabricated `_site` unclosed fence | PASS / exit 0 | Census remained byte-identical. |
| Real source-page unclosed fence | expected FAIL / exit 1 | Throwaway `2d29a7f0c`; `index.vto:162: unclosed` fence; reverted by `ba3ec1cdc`. |
| `non-exported-symbol` | expected FAIL / exit 1 | Type checking failed. |
| `empty-exemption-reason` | expected FAIL / exit 1 | Malformed fence named. |
| `dialect-a-object-input` | expected FAIL / exit 1 | Type checking failed. |
| `dialect-a-positional` | PASS / exit 0 | Green control. |
| `dialect-b-object-input` | PASS / exit 0 | Green control. |
| Bare negative task | expected FAIL / exit 1 | Missing fixture usage printed. |

### Fitness / Runtime / Consumer Gates

| Gate family | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Fitness | N/A | no package/plugin changes | Scope boundary preserved. |
| Runtime | N/A | no runtime behavior | `e2e:cli` explicitly prohibited and not run. |
| Consumer | PASS | built-output and real-source controls above | Exclusion neither changes census nor blunts source failures. |

## Handoff Notes

- Inspect walker exclusion semantics and exact census first.
- IMPL-EVAL and ready/merge transitions are explicitly not performed by this implementation lane.
- Post-slice reconcile: #1565 remains open at milestone `0.0.6`; the draft PR will carry `Closes #1565`, the requested labels, and only `status:impl`.
