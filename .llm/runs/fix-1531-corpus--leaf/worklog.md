# Worklog: shipped agent-docs corpus freshness

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-1531-corpus--leaf` |
| Branch | `fix/1531-agent-docs-corpus-gate` |
| Archetype | N/A — docs/tooling |
| Scope overlays | `SCOPE-docs.md` |

## Design

### Public Surface

- Root tasks `gen:agent-docs-prose` and `check:agent-docs-prose`.
- Existing CI quality job gains an explicit agent-docs corpus freshness step.
- Existing `docs:accuracy` also validates shipped corpus vocabulary.

### Domain Vocabulary

- `AgentDocsProseProvenance` — metadata beside the compressed corpus.
- Site-derived entries — `llms.txt`, `llms-full.txt`, and `pages/**`.
- Preserved entries — current non-site corpus membership, presently `context/**`.

### Ports

- Rendered docs-site directory — input seam produced by the existing Lume build.
- Git command — normal-mode provenance source only.

### Constants

- `SITE_DERIVED_PREFIXES` — the finite site-owned corpus paths.
- `FORBIDDEN_GOLDEN_PATH_TERMS` — one shared vocabulary list for site and shipped corpus checks.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 0 | Activate run and draft PR | branch/PR identity | `supervisor.md` |
| 1 | Implement deterministic corpus rebuild + CI/accuracy gates and record full evidence | focused tests, positive/negative freshness checks, direct census, requested gates | run artifacts, `deno.json`, docs tools/tests, CI workflow, generated corpus/assets |

### Deferred Scope

- Corpus content selection — #1260.
- MCP export/serving surface — #1201.
- Release-time version rewrite semantics — unchanged.

### Contributor Path

Update `docs/site`, run `deno task gen:agent-docs-prose`, then run
`deno task check:agent-docs-prose`; CI runs the same freshness check in its quality job.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-08-12 | 0 | Bootstrap | Verified clean branch/base, wrote `supervisor.md` first, committed `73ed851d3`, pushed explicit refspec, and opened draft PR #1608. |
| 2026-08-12 | 1 | Baseline | 60 corpus / 13 MCP generated `api-clients`; zero site occurrences; eight corpus `@contracts`; 174 files; 74 site files moved since snapshot; zero workflow callers. |
| 2026-08-12 | 1 | Plan gate | `PLAN-EVAL: N/A` — issue #1531 supplies a mechanical contract, scope boundaries, acceptance rows, exact generator path, and required gates; no architecture decision remains open. |
| 2026-08-12 | 1 | Implementation | Added a rendered-site rebuild mode that replaces only site-owned entries, preserves external context membership, and gives check mode stable provenance; wired the check into CI and extended `docs:accuracy` to the shipped corpus. |
| 2026-08-12 | 1 | Regeneration | Rebuilt the corpus and both CLI/MCP embedded generated assets. The after census is zero `api-clients` and zero `@contracts`; provenance now identifies commit `73ed851d3` and 178 files. |
| 2026-08-12 | 1 | Negative proof | Added one temporary sentence to `docs/site/ai/agent-tooling.md` without regenerating. `deno task check:agent-docs-prose` returned raw exit `1`; restored the page and reran the check green. No `docs/site` or `deno.lock` diff remains. |
| 2026-08-12 | 1 | Validation | Focused/scoped checks and corpus gates pass. `docs:links` retains two base-existing broken doctrine anchors. Root tests finish with 3300 passed and two failures: one base-existing JSDoc codename and one refreshed-corpus ranking mismatch outside this leaf's content-selection scope. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Regenerate content and prove it directly | Exit-zero/rewrite checks cannot detect stale-but-consistent bytes. | issue #1531 |
| Preserve non-site corpus membership | Selection is explicitly outside this leaf. | #1260 boundary |
| Add both diff and forbidden-vocabulary defenses | They fail independently on source drift and known stale claims. | issue cheaper-half acceptance |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Owner evaluator route overrides default Fable pairing with native Opus 5 read-only fallback. | minor/process | yes |
| Existing docs link gate has two broken doctrine debt anchors on the unchanged base. | pre-existing | yes |
| Fresh corpus changes one locked MCP guidance result; expected content selection is owned by #1260. | surfaced/out-of-scope | yes |
| Root fitness test finds `#1589` in unchanged published JSDoc. | pre-existing | yes |

## Corpus Census

| Assertion | Before | After |
| --------- | ------ | ----- |
| `api-clients` in decompressed corpus | 60 | 0 |
| `api-clients` in MCP generated asset | 13 | 0 |
| `api-clients` under `docs/site` | 0 | 0 |
| `@contracts` in decompressed corpus | 8 | 0 |
| Corpus file count | 174 | 178 |
| Provenance source commit | `eda49bb2e` | `73ed851d3` |

After regeneration, provenance reports version `0.0.5`, extraction timestamp
`2026-08-12T18:04:18.425Z`, uncompressed bytes `4716783`, compressed bytes `1351773`, and SHA-256
`3df3e30f79ebd06b4c4688f9d8c1aff657c85de01ba64ea8fab61be7eb652757`.

## Gate Results

| Gate | Exit | Evidence |
| ---- | ---- | -------- |
| Focused docs-tool tests | 0 | `10 passed, 0 failed` |
| `deno task check:agent-docs-prose` | 0 | Regenerated bytes match the index; rerun after the negative control also returned 0. |
| Negative corpus freshness control | **1** | Temporary unregenerated `docs/site` edit produced binary/provenance diffs; raw `RAW_NEGATIVE_EXIT=1`. |
| Direct content census | 0 | Corpus/MCP `api-clients=0`; corpus `@contracts=0`; source commit is after base. |
| `deno task check:assets-barrel` | 0 | Generated asset barrel is consistent. |
| `deno task check:publish-assets` | 0 | Publish assets are consistent; not treated as freshness proof. |
| `deno task docs:snippets` | 0 | `scanned=578 ... malformed=0`; no `_site` regression. |
| `deno task docs:accuracy` | 0 | `196 source pages`, `178 shipped corpus files`, `91/91 public commands`, `6 fresh imports`. |
| `deno task docs:links` | 1 | Two pre-existing broken anchors from doctrine verdict to `arch-debt.md`; both files are unchanged from base. |
| Scoped check/lint/fmt: `.llm/tools/docs` | 0/0/0 | 22 files; zero failures/findings. |
| Scoped check/lint/fmt: generated CLI asset | 0/0/0 | One file; zero failures/findings. |
| Scoped check/lint/fmt: generated MCP asset | 0/0/0 | One file; zero failures/findings. |
| `deno task test` | 1 | `3300 passed (624 steps), 2 failed, 17 ignored` in 3m59s; failures are recorded below and in `drift.md`. |

The root-test failures are:

1. `published JSDoc excludes internal workstream codenames`: unchanged base source contains `#1589`
   in `netscript-web-runtime-closure.ts:6`.
2. `locked release-corpus guidance is deterministic and equal across both adapters`: the fresh
   snapshot ranks the plugin-system page where the existing fixture expects the external-database
   page. This is a real consequence of regeneration, but changing corpus membership/ranking is
   explicitly #1260 scope; the docs content and fixture were left untouched and the drift was
   recorded.

## Handoff Notes

- Evaluator should inspect the normal/check provenance split, the workflow call site, direct corpus
  contents, the raw negative-control exit, and the out-of-scope guidance-ranking drift first.
- No evaluator was run here; the orchestrator owns the native Opus 5 read-only fallback per
  immutable head.
