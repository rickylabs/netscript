# Worklog — #607 close-gate evidence mirror

## Design

- Public surface: `mirror-acceptance-evidence.ts` CLI with `--repo`, `--pr`, `--dry-run`, `--pretty`.
- Domain vocabulary: acceptance checkbox, evidence entry, mapping error, issue patch, provenance.
- Ports: GitHub REST reads/writes behind a small client; pure markdown functions take strings.
- Constants: closing-keyword, checkbox, heading, and exact acceptance-evidence heading patterns.
- Commit slices:
  1. Pure mapping + mirror CLI + tests; proved by focused tests/check/lint/fmt.
  2. Ready-merge CI wiring + canonical skill/mirror; proved by workflow review/actionlint and sync.
  3. Live dry-run, final evidence, commit and push; proved by command output and raw git state.
- Deferred: semantic evidence-quality assessment and broad lifecycle automation.
- Contributor path: extend pure parsing in `acceptance-evidence.ts`, add table tests, keep GitHub IO in
  the mirror CLI.

## PLAN-EVAL waiver

Owner explicitly waived PLAN-EVAL in the slice brief. Planning is recorded here before
implementation; drift D1 documents the exception.

## Validation evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused tests | PASS | `deno test .llm/tools/validation` — 5 passed, 0 failed. |
| Scoped check | PASS | wrapper selected 7 files; 0 failed batches/findings. |
| Scoped lint | PASS | wrapper selected 7 files; 0 occurrences. |
| Scoped format | PASS | wrapper selected 7 files; 0 findings. |
| Skill mirror | PASS | `agentic:sync-claude:check` — 17 skills, 21 files, no drift. |
| Workflow YAML | REVIEWED | `actionlint` is not installed; indentation, expressions, job-level permissions, and sequential step ordering reviewed manually. |
| Live dry-run | PASS | PR #467 / closing issue #387: `acceptance-mirror DRY-RUN: no changes`; no PATCH/comment performed. |

## Reconcile notes

- S1/S2: issue #607 remains the owned child; no PR was opened per the brief. The workflow is opt-in
  through the existing `status:ready-merge` lifecycle label. No taxonomy changes are needed.
