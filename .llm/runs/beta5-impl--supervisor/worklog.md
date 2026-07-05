# Worklog: issue #305 doctrine quick-win

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `beta5-impl--supervisor` |
| Branch | `chore/305-doctrine-quickwin` |
| Archetype | Archetype 6 for checker tooling; N/A for docs-only files |
| Scope overlays | `SCOPE-docs.md` |

## Design

### Public Surface

- `.llm/tools/fitness/check-doctrine.ts` CLI behavior and text output.
- Doctrine Markdown files under `docs/architecture/doctrine/`.
- Harness evaluator/debt references under `.llm/harness/`.

### Domain Vocabulary

- `DoctrineRef` — canonical AP/F/A identifiers from doctrine file 09.
- `RefMigration` — old checker/debt/evaluator ref to current doctrine ref.
- `Phase0Citation` — stale local research link that must become live doctrine prose or a live local
  link.

### Ports

- None. This slice does not introduce runtime abstractions or external dependencies.

### Constants

- Canonical AP range: `AP-1..AP-25`.
- Canonical F range: `F-1..F-19`.
- Out-of-scope issue reference: `Refs #305`, never `Closes #305`.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 0 | Bootstrap harness run and draft PR surface | git status, draft PR created | `.llm/runs/beta5-impl--supervisor/*` |
| 1 | Retire stale Result/shared gate and reconcile checker refs | `.llm/tools` Deno check; before/after `arch:check` comparison | `.llm/tools/fitness/check-doctrine.ts` |
| 2 | Purge dead phase-0 doctrine links | `rg "phase-0-research" docs/architecture/doctrine` | `docs/architecture/doctrine/*.md` |
| 3 | Add ref migration map and reconcile harness refs | link/ref grep review | `docs/architecture/doctrine/ref-migration-map.md`, `.llm/harness/debt/arch-debt.md`, `.llm/harness/evaluator/anti-pattern-catalog.md` |
| 4 | Final validation and slice-complete handoff | requested validation set | run artifacts and PR comments |

### Deferred Scope

- Doctrine v2 rewrite — owner decision pending.
- Package remediation — separate issues/PRs.
- New comprehensive AST fitness scripts — not required for this quick-win.

### Contributor Path

Start at `docs/architecture/doctrine/ref-migration-map.md` to translate old refs, then update
`check-doctrine.ts` messages/refs and run the validation plan in `plan.md`.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-06 | 0 | Bootstrap | Created run artifacts from current-tree research. |
| 2026-07-06 | Plan-Gate | PASS | Separate PLAN-EVAL wrote `plan-eval.md`; implementation may begin. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Keep Result detection but remove `@netscript/shared` requirement | Retires live misfire while preserving inline-contract warning | `plan.md` LD-1 |
| Use doctrine 09 as AP/F authority | Prevents evaluator/checker drift | `research.md` finding 2 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Run directory absent despite prompt naming `beta5-impl--supervisor` | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| `.llm/tools` Deno check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts` | NOT_RUN | Planned after implementation. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| `arch:check` baseline | NOT_RUN | `deno task arch:check` | Run before implementation slice 1. |
| `arch:check` after | NOT_RUN | `deno task arch:check` | Run after implementation. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Runtime behavior | N/A | docs/tooling text only | No runtime package behavior changed. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| Package consumers | N/A | no package public exports changed | Docs/tooling quick-win. |

## Handoff Notes

- Evaluator should inspect `check-doctrine.ts` for stale `@netscript/shared`, doctrine files for
  dead `phase-0-research`, and `ref-migration-map.md` for AP/F trust.
