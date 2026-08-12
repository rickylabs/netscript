# Worklog: PR-C #1380 doctrine verdict and repository gate

## Run Metadata

| Field | Value |
| --- | --- |
| Slice | `pr-c-1380` |
| Branch | `fix/1380-doctrine-verdict-and-repo-gate` |
| Base | `fa5d0d411054ba8aea272df392eb4e85b57c0d41` |
| Route | Codex GPT-5.6 Sol medium (implementation) |
| Profile | Archetype 6 tooling + `SCOPE-docs` |
| Parent | `release-0.0.6-internals--orchestration` (Claude Opus 5 high) |
| Plan gate | PASS, cycle 5, before implementation (parent orchestrator record) |

## Design

### Public Surface

- `deno task arch:check:repo` — evaluates every discovered top-level doctrine unit.
- Doctrine files 06, 10, `rfcs/README.md`, and the `netscript-pr` skill — contributor-facing governance.

### Domain Vocabulary

- **Doctrine root** — a top-level `packages/*` or `plugins/*` directory with a named `deno.json`.
- **Verdict row** — one measured live doctrine root and its current archetype/verdict.
- **Removed-row provenance** — repository-history and debt-registry evidence for a stale row.
- **Canonical RFC** — an accepted numbered `rfcs/NNNN-*.md`; harness canonical bundles remain draft/provenance.

### Ports

- None. This slice uses `discoverDoctrineRoots()` and existing filesystem/GitHub surfaces.

### Constants

- 36 live units: 30 `packages/*` + 6 `plugins/*`.
- Five pending decision IDs are locked by the implementation brief.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| S1 | Discovered-root repo verdict + narrow fixture-line guard | focused fitness test; `arch:check:repo` | `deno.json`, `check-doctrine*.ts` |
| S2 | Measured doctrine tables, provenance, debt/RFC/reference records, doc contracts | fitness/doc tests | doctrine 06/10, `arch-debt.md`, `rfcs/README.md`, doc test |
| S3 | Correct label/rerun operator guidance and mirror | validation tests; Claude sync/check | `netscript-pr`, close-gate source/tests, generated mirror |
| S4 | Final gate evidence and acceptance mapping | complete requested gate matrix | run artifacts + PR body/comment |

### Deferred Scope

- Six Refactor/Restructure units, filing five RFCs, workflow-trigger changes, and PR-D quality tooling are explicitly out of scope.

### Contributor Path

Update top-level units, then run the doctrine contract tests; the measured tables and documented gated set must agree with `discoverDoctrineRoots()`.

## Progress Log

| Date | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-12 | S0 | Bootstrap | Commit `8ddc17abbe24108b9fc30c35aaae03114336ce20`; draft PR #1585 opened. |
| 2026-08-12 | S1 | Implement + focused gate | `arch:check:repo` now selects all roots; leading quote/backtick fixture data ignored; real unresolved global remains red. |
| 2026-08-12 | S2 | Measurement + doc contracts | Doctrine 06/10 now enumerate 36 roots; removed-row provenance, debt closure, gated-set exclusion, dated reference plan, and RFC mapping are executable documentation contracts. |
| 2026-08-12 | S3 | Operator guidance + mirror | Source/mirrored skill and close-gate hint now require rerunning existing CI after labeling, without a verdict-invalidating push. |
| 2026-08-12 | S4 | Final gate matrix | All requested gates passed on source head `bef1d9b4806b04da51d0120de6d9df08f0699bde`; this evidence-only update is the final planned commit. |
| 2026-08-12 | S3b | Live-preflight drift repair | Acceptance-mirror dry-run exposed the same stale labeled-event claim; notice and regression test corrected without workflow changes. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Reuse `--all-roots` | It already iterates `discoverDoctrineRoots()`; no second selector. | PR-B / implementation brief |
| Guard per source line only | Matches the existing quality scanner and preserves real syntax detection. | `scan-code-quality.ts` |
| Keep WARN findings non-fatal | The checker already defines repo verdict by FAIL count; package refactors are separate slices. | #1380 boundaries |

## Drift

Minor D-1: the live acceptance-mirror notice repeated R-11's stale labeled-event claim. Fixed in S3b
and recorded in `drift.md`.

## Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused doctrine tests | PASS, exit 0 | 2 passed, 0 failed |
| `deno task arch:check:repo` | PASS, exit 0 | 36 roots, zero FAIL; warnings remain advisory |
| Doctrine doc contracts | PASS, exit 0 | 6 passed, 0 failed; includes path soundness/coverage, assignment sync, dated plan, RFC mapping, and provenance |
| `deno task arch:check` | PASS, exit 0 | dependency checks + all 36 doctrine roots, zero FAIL |
| S2 scoped fitness wrappers | PASS, exit 0 | 7 files selected; check/lint/fmt zero findings |
| Close-gate focused tests | PASS, exit 0 | 15 passed, 0 failed; repair-hint contract included |
| S3 scoped validation wrappers | PASS, exit 0 | 18 files selected; check/lint/fmt zero findings |
| Claude skill mirror | PASS, exit 0 | sync updated one stale skill; `agentic:check-claude` all checks OK |

### Final requested gate matrix

| # | Command | Exit | Literal summary |
| --- | --- | --- | --- |
| 1 | `deno test --allow-read --allow-env --allow-write --allow-run .llm/tools/fitness/` | 0 | `ok | 10 passed | 0 failed` |
| 2 | `deno task arch:check` | 0 | dependency checks passed; 36 root reports, every `FAIL=0` |
| 3 | `deno task arch:check:repo` | 0 | 36 root reports, every `FAIL=0`; advisory WARN residue is non-fatal |
| 4 | `deno task quality:gate` | 0 | quality scan `{ "ok": true, "findings": [] }`; chained doctrine gate passed |
| 5a | check wrapper, roots `fitness` + `validation`, `--ext ts` | 0 | 25 files, 1 batch, 0 failed batches / occurrences |
| 5b | lint wrapper, same roots | 0 | 25 files, 1 batch, 0 findings |
| 5c | fmt wrapper, same roots | 0 | 25 files, 1 batch, 0 findings |
| 6 | `deno task gen:assets-barrel`; `git status --porcelain` | 0 / 0 | generator emitted no drift; status output empty |
| 7 | `deno task agentic:sync-claude`; `deno task agentic:check-claude` | 0 / 0 | 18 skills / 22 files synced; every Claude surface check `OK` |
| 8 | `deno test ... check-doctrine-docs_test.ts` | 0 | `ok | 6 passed | 0 failed` |

## Handoff Notes

- The parent orchestrator performs substantive slice review and owns draft → ready / IMPL-EVAL.
- Final acceptance evidence is mapped in PR #1585 by `box-index: 1..13`; box 5 cites PR-B commit
  `e391f3aec` rather than claiming implementation in this PR.
