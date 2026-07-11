# Worklog: #611 CI Markdown-only classifier

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-611-ci-docs-only-md--ci-classifier` |
| Branch | `fix/611-ci-docs-only-md` |
| Archetype | `N/A` |
| Scope overlays | `docs` |

## Design

### Public Surface

- `isDocsOnlyPath`, `decide`, and `parseNameStatus` remain the classifier/test entry points.
- PR-opening guidance in the two source skills; `.claude/skills` is generated output.

### Domain Vocabulary

- docs-only diff — non-empty changed-path set whose every path is allowed documentation.
- critical path — workflow or Deno configuration/lock path that forces full classification.
- rename-aware path set — both source and destination paths for renames/copies.

### Ports

- None; pure classifier and checked-in documentation.

### Constants

- Existing `IMPACTING_PREFIXES`, `IMPACTING_EXACT`, `DOCS_EXTENSIONS`; refine semantics without new abstraction.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Harness plan establishes the reviewed contract and draft PR | PLAN-EVAL | `.llm/runs/fix-611-ci-docs-only-md--ci-classifier/*` |
| 2 | Classifier proves global Markdown/MDX docs-only behavior and critical-path safety | focused tests + scoped check | `.github/scripts/ci-classify-changes.ts`, `.github/scripts/ci-classify-changes.test.ts`, run artifacts |
| 3 | PR/harness guidance and generated mirrors prove proactive CI label handling | sync + sync check | source skills, generated Claude mirrors, run artifacts |

### Deferred Scope

- Workflow/label automation changes are outside #611.

### Contributor Path

Edit the pure path predicates and add a table-style regression in `ci-classify-changes.test.ts`; edit only `.agents/skills` sources and regenerate mirrors.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-11 | 1 | research/plan | Re-baselined at `origin/main`; awaiting separate PLAN-EVAL. |
| 2026-07-11 | 1 | PLAN-EVAL | Separate Claude Opus evaluator returned `PASS`; implementation unlocked. |
| 2026-07-11 | 2 | implementation | Global Markdown/MDX precedence added after critical-path guard; rename parsing preserved. |
| 2026-07-11 | 2 | gates | 30 classifier tests, scoped check, and scoped format check passed. |
| 2026-07-11 | 2 | reconcile | Issue #611 remains open; PR #613 has `Closes #611`, parent/motivating refs, beta.7 milestone, and `status:plan-eval` pending phase transition. No new comments required readjustment. |

## Gate Results

- PLAN-EVAL — `PASS`; see `plan-eval.md`.
- Classifier tests — `PASS` (30 passed, 0 failed).
- Scoped check (`.github/scripts`, TS/TSX) — `PASS` (2 files, 0 findings).
- Scoped format check (`.github/scripts`, TS/TSX) — `PASS` (2 files, 0 findings).

## Handoff Notes

- IMPL-EVAL should scrutinize Markdown precedence versus explicit workflow/Deno critical paths and the rename-old-path behavior.
