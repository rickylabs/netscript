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

- Corpus ranking behavior and its locked fixture — tracked by #1615. #1260 is closed after
  addressing corpus presence.
- MCP export/serving surface — unchanged here; historical issue #1201 is closed.
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
| 2026-08-12 | 1 | Commit/handoff | Committed implementation as `26b759023`, pushed with the required explicit refspec, and posted the structured IMPL evidence comment to draft PR #1608. |
| 2026-08-12 | 2 | Exact-head evaluation | Native Opus 5 read-only fallback returned `FAIL_FIX`: mechanism and negative control confirmed; requested moving-base regeneration and corrected deferred ownership. |
| 2026-08-12 | 2 | Rebase/regeneration | Rebased cleanly onto `origin/main@6aee2b414`, regenerated the corpus and both dependent generated assets, and preserved a clean `deno.lock`. The triggers reference entry now contains two `TriggerEventSubscriptionMessage` occurrences, matching the source page. |
| 2026-08-12 | 2 | Targeted validation | Freshness, asset-barrel, publish-asset, snippets, and accuracy checks all exit 0; direct census remains zero for stale terms and the triggers entry is 2/2. Root tests were not rerun because the cycle brief restricts reruns to rebase-invalidated gates; the known ranking failure is tracked by #1615. |
| 2026-08-12 | 2 | Latest-base reconcile | While PR evidence was being updated, `main` advanced again to `6b29d12ea` through PR #1614. That commit does not touch `docs/site`; rebased again, reran normal generation so provenance is ancestral to the latest base, and rebuilt both dependent assets. |
| 2026-08-12 | final | Exact merge-base rebase | Rebased cleanly onto live `origin/main@bcfbd0f65`, which includes PR #1617. No intervening commit touches `docs/site`; normal regeneration produced the identical corpus blob/SHA and changed only provenance plus its two dependent generated assets. |
| 2026-08-12 | final | Merge-base gates | `check:agent-docs-prose`, root tests, assets-barrel, and publish-assets all returned raw exit 0. Root tests are fully green at `3355 passed`, `0 failed`, `17 ignored`; `deno.lock` and `docs/site` remain unchanged. |
| 2026-08-12 | telemetry rebase | Moving corpus input | Rebased cleanly onto live `origin/main@bfcf4ed11` after PR #1605 changed `docs/site/reference/telemetry/index.md`. Normal regeneration moved the corpus SHA-256 from `105b8e0a…` to `fc121f9c…`; the parsed entry delta is confined to the telemetry page and `llms-full.txt` (`llms.txt` is byte-identical). |
| 2026-08-12 | telemetry rebase | Exact-head gates | Freshness, root tests, asset-barrel, publish-assets, and corpus-aware docs accuracy all returned raw exit 0. Root tests report `3378 passed`, `0 failed`, `17 ignored`; `deno.lock` remains byte-identical. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Regenerate content and prove it directly | Exit-zero/rewrite checks cannot detect stale-but-consistent bytes. | issue #1531 |
| Preserve non-site corpus membership | Selection is explicitly outside this stale-snapshot leaf; #1260 is closed after addressing presence. | issue #1531 boundary |
| Add both diff and forbidden-vocabulary defenses | They fail independently on source drift and known stale claims. | issue cheaper-half acceptance |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Owner evaluator route overrides default Fable pairing with native Opus 5 read-only fallback. | minor/process | yes |
| Existing docs link gate has two broken doctrine debt anchors on the unchanged base. | pre-existing | yes |
| Fresh corpus changes one locked MCP guidance result; regression is tracked by #1615. | surfaced/out-of-scope | yes |
| Root fitness test finds `#1589` in unchanged published JSDoc; #1612 / PR #1614 own the fix. | pre-existing | yes |
| `--check` writes regenerated bytes before diffing and can leave a failed check's output in the worktree. | non-blocking/tooling | yes |
| Pinned check-mode provenance means version/sourceCommit metadata drift is not independently gated. | non-blocking/tooling | yes |

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

### Cycle-2 rebased census

| Assertion | Rebased result |
| --------- | -------------- |
| `api-clients` in decompressed corpus | 0 |
| `api-clients` in MCP generated asset | 0 |
| `from "@contracts"` in decompressed corpus | 0 |
| `TriggerEventSubscriptionMessage` in source triggers page | 2 |
| `TriggerEventSubscriptionMessage` in the matching corpus page entry | 2 |
| Provenance source commit | `c0b7bdf25` (descendant of `origin/main@6b29d12ea`) |

Cycle-2 provenance reports version `0.0.5`, extraction timestamp
`2026-08-12T18:49:44.899Z`, uncompressed bytes `4716931`, compressed bytes `1351792`, and SHA-256
`105b8e0a081249ae5b93d58fc87ca3dbdbe79de7aa2ef140d0629b29e8757908`.

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

### Cycle-2 targeted gates

| Gate | Exit | Evidence |
| ---- | ---- | -------- |
| `deno task check:agent-docs-prose` | 0 | Check-mode regeneration left zero unstaged corpus/provenance diff. |
| `deno task check:assets-barrel` | 0 | Rebased CLI generated asset is current. |
| `deno task check:publish-assets` | 0 | Rebased MCP publish asset is current; not treated as source-freshness proof. |
| Direct content census | 0 | Corpus/MCP `api-clients=0`; corpus `from "@contracts"=0`; triggers source/corpus entry is 2/2. |
| `deno task docs:snippets` | 0 | `scanned=578 ... malformed=0`. |
| `deno task docs:accuracy` | 0 | `196 published source pages`, `178 shipped corpus files`, `91/91` commands, `6` valid Fresh imports. |
| Lock/source hygiene | 0 | `deno.lock` and `docs/site` have zero diff after every generator/check run. |
| `deno task test` | not rerun | Cycle brief limited reruns to rebase-invalidated gates; known guidance ranking failure is #1615. |

### Final exact-merge-base gates

| Gate | Raw exit | Evidence |
| ---- | -------- | -------- |
| Normal regeneration | 0 | Corpus gzip blob remains `36fbb82824c37167d65624596787f85833cc7de7`; SHA-256 remains `105b8e0a081249ae5b93d58fc87ca3dbdbe79de7aa2ef140d0629b29e8757908`. Only provenance and the two dependent generated assets changed. |
| `deno task check:agent-docs-prose` | 0 | Emitted the same SHA-256 and left zero corpus/provenance diff. |
| `deno task test` | 0 | `3355 passed (624 steps)`, `0 failed`, `17 ignored` in 3m22s. |
| `deno task check:assets-barrel` | 0 | Rebased CLI generated asset is current. |
| `deno task check:publish-assets` | 0 | Rebased MCP generated asset is current. |
| Lock/source hygiene | 0 | `deno.lock` and `docs/site` have zero diff; final `git status --porcelain` is recorded after commit/push. |

### Telemetry-input rebase census

`origin/main@bfcf4ed11` adds public telemetry documentation through PR #1605. Parsed JSON comparison
against evaluated head `d2f5fa39b` proves the corpus-content delta rather than inferring it from a
generator exit:

| Assertion | Previous evaluated head | Rebased regeneration |
| --------- | ----------------------- | -------------------- |
| Corpus SHA-256 | `105b8e0a081249ae5b93d58fc87ca3dbdbe79de7aa2ef140d0629b29e8757908` | `fc121f9c0bb737e3776d64c03f6d940d7a5e1b14d5e35100c9923a3602a10da3` |
| Corpus file count | 178 | 178 |
| `api-clients` in corpus / MCP generated asset | 0 / 0 | 0 / 0 |
| `@contracts` in corpus / MCP generated asset | 0 / 0 | 0 / 0 |
| Changed entries | — | `llms-full.txt`; `pages/reference/telemetry/index.md` |
| Allowed but unchanged entry | — | `llms.txt` (55,279 bytes; identical SHA-256 `f9d7dfc7…`) |

The gzip itself changed from 1,351,792 to 1,352,791 bytes. Entry-level hashes changed from
`c8bac58f…` to `6cc15101…` for `llms-full.txt` and from `967999af…` to `353b023d…` for the telemetry
page. No entries were added or removed, and no entry outside the telemetry/`llms*` allowlist moved.

### Telemetry-input rebase gates

| Gate | Raw exit | Evidence |
| ---- | -------- | -------- |
| `deno task check:agent-docs-prose` | 0 | Emitted SHA-256 `fc121f9c0bb737e3776d64c03f6d940d7a5e1b14d5e35100c9923a3602a10da3`; zero unstaged corpus/provenance diff. |
| `deno task test` | 0 | `3378 passed (624 steps)`, `0 failed`, `17 ignored` in 3m20s. |
| `deno task check:assets-barrel` | 0 | Rebuilt CLI generated asset matches the staged bytes. |
| `deno task check:publish-assets` | 0 | Rebuilt MCP publish asset matches the staged bytes. |
| `deno task docs:accuracy` | 0 | `196 published source pages`, `178 shipped corpus files`, `91/91` commands, `6` valid Fresh imports. |
| Lock hygiene | 0 | `deno.lock` hash remained `6a1b1a2091c8468161b893aa7dd694de53b9bfd4` after every generator and gate. |

The root-test failures are:

1. `published JSDoc excludes internal workstream codenames`: unchanged base source contains `#1589`
   in `netscript-web-runtime-closure.ts:6`. This was the earlier-base result; #1612 / PR #1614 now
   supply the fix on latest `main`, without any change from this PR.
2. `locked release-corpus guidance is deterministic and equal across both adapters`: the fresh
   snapshot ranks the plugin-system page where the existing fixture expects the external-database
   page. This is a real consequence of regeneration tracked by #1615; the docs content and fixture
   were left untouched. `git diff --quiet 0551ff592 HEAD -- packages/mcp/tests/` exits 0.

These are historical cycle-1 failures. Current `main` includes PR #1617, which fixed the ranking by
changing `packages/mcp/src/domain/docs/guidance-index.ts` scoring and one test while leaving
`packages/mcp/tests/fixtures/**` untouched. The final exact-merge-base root suite is green.

## Handoff Notes

- Evaluator should inspect the normal/check provenance split, the workflow call site, direct corpus
  contents, the raw negative-control exit, and the out-of-scope guidance-ranking drift first.
- No evaluator was run here; the orchestrator owns the native Opus 5 read-only fallback per
  immutable head.
- Freshness regeneration is inherently repeatable, not a one-time migration: if `docs/site` moves
  again before merge, regenerate the corpus and both dependent assets again immediately before the
  next exact-head check.
- PR #1605 demonstrates that invariant directly: a later telemetry source change required another
  content regeneration and moved the corpus hash. A previously green exact-head result is not
  permanent evidence after the merge base gains a corpus input.
