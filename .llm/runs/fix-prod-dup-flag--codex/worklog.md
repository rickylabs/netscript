# Worklog: published workers-api dependency-age hotfix

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-prod-dup-flag--codex` |
| Branch | `fix/e2e-prod-dup-dep-age-flag` |
| Archetype | 6 — CLI/tooling (internal E2E fixture) |
| Scope overlays | none |

## Design

### Public Surface

- No product/public surface changes; an internal pure rewrite helper is consumed by the fixture script.

### Domain Vocabulary

- Workers block — generated `workers-api` Aspire resource source segment.

### Ports

- None; the rewrite is pure string transformation.

### Constants

- Dependency-age argument and flow-B config filename remain literals local to the helper.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Preserve exactly one dependency-age flag for old/new published blocks | focused test + scoped check/lint | fixture, helper, test, run artifacts |

### Deferred Scope

- Product templates and full runtime verification are explicitly outside this hotfix.

### Contributor Path

Read the pure helper and its two shape tests before changing published workers launch rewriting.

## Progress Log

- 2026-07-11: diagnosis re-baselined; design locked; PLAN-EVAL owner-waived.
- 2026-07-11: implemented config-only published rewrite with conditional dependency-age insertion.
- 2026-07-11: post-slice reconcile found no scope drift; PR/GitHub reconciliation is N/A because
  the owner explicitly prohibited opening a PR.

## Drift

- D1: PLAN-EVAL waived by owner for release-critical hotfix; recorded in `drift.md`.

## Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused fixture unit test | PASS | `deno test packages/cli/e2e/tests/application/gates/configure-published-workers-block_test.ts` — 2 passed |
| Scoped check | PASS | `run-deno-check.ts --root packages/cli --ext ts,tsx` — 599 files, 0 findings |
| Scoped lint | PASS | `run-deno-lint.ts --root packages/cli --ext ts,tsx` — 599 files, 0 findings |
| Focused format check | PASS | `run-deno-fmt.ts` on the two owning e2e gate roots — 18 files, 0 findings |
| Full scaffold runtime | NOT_RUN | Owner/orchestrator reserved published-mode verification |

## Handoff Notes

- Review the helper's conditional insertion and the two old/new published template shape tests.
- No lockfile changes and no product scaffold/template changes.
