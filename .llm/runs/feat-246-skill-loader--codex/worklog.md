# Worklog: `@netscript/ai/skills`

## Run Metadata

| Field          | Value                          |
| -------------- | ------------------------------ |
| Run ID         | `feat-246-skill-loader--codex` |
| Branch         | `feat/246-skill-loader-port`   |
| Archetype      | `2 - Integration`              |
| Scope overlays | none                           |

## Design

### Public Surface

- `@netscript/ai/skills` entrypoint.
- `SkillLoaderPort`: `list`, `load`, `matchByTag`, `matchByQuery`.
- `parseSkillMarkdown`, `createSkillLoader`, `createInMemorySkillContentSource`.
- `matchByTags`, `matchBySemantic` pure matching functions.
- Document/result/options types needed to call those operations.

### Domain Vocabulary

- `SkillSummary` — cheap validated metadata without body.
- `SkillDocument` — summary metadata plus full body.
- `SkillMatch` — summary, score, and matched trigger modes.
- `SkillMatchMode` — finite `tag | semantic` discriminator.
- `SkillSourceEntry` — caller-supplied id/markdown pair for the in-memory adapter.

### Ports

- `SkillContentSource` — lists summaries and loads raw markdown by id; observable two-phase seam.
- `EmbeddingProviderPort` — existing optional semantic capability; never invoked when disabled.

### Constants

- `SKILL_MATCH_MODES` — `tag`, `semantic`.
- Internal tag scores — exact `1`, substring `0.5`.

### Commit Slices

| # | Slice                                                          | Gate                                                   | Files                                                                            |
| - | -------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| 1 | Proves the validated two-tier loader and trigger contract      | targeted unit + scoped check                           | `packages/ai/src/skills/**`, replacement port, `deno.json`, tests, run artifacts |
| 2 | Proves package layering, documentation, and JSR publishability | scoped lint/fmt, full AI tests, arch/doc/publish gates | fixes from gates, README, run artifacts                                          |

### Deferred Scope

- UI, persistence, fs/git/network sources, authoring approval, scaffolding, orchestration, concrete
  embeddings, and caching — explicitly owned by later/app slices.

### Contributor Path

Start at `packages/ai/src/skills/mod.ts` for the curated contract, add content-source technologies
as named adapters implementing `SkillContentSource`, and keep selection policy in
`src/skills/application/` without importing adapters.

## Progress Log

| Time       | Slice | Step      | Notes                                                                               |
| ---------- | ----- | --------- | ----------------------------------------------------------------------------------- |
| 2026-07-11 | plan  | complete  | Issue read fully; baseline verified; package mapping and placeholder port recorded. |
| 2026-07-11 | 1     | complete  | Contract, parser, adapter, matchers, and five tests landed in `c67e0121`.           |
| 2026-07-11 | 1     | reconcile | #246 remains open; no PR/comment by instruction; scope unchanged.                   |
| 2026-07-11 | 2     | complete  | README and all requested package/doctrine/JSR gates are green.                      |
| 2026-07-11 | 2     | reconcile | No new issue comments or scope changes; handoff is commit/push only.                |

## Decisions

| Decision               | Reason                                                           | Source                  |
| ---------------------- | ---------------------------------------------------------------- | ----------------------- |
| Owner-waived PLAN-EVAL | Explicit slice brief; carried drift D1.                          | user brief / `drift.md` |
| Archetype 2            | Two injected external capability seams and an in-memory adapter. | doctrine / issue #246   |

## Drift

| Drift                                                 | Severity    | Logged in drift.md |
| ----------------------------------------------------- | ----------- | ------------------ |
| PLAN-EVAL owner-waived                                | significant | yes                |
| Old issue path maps to `packages/ai`                  | minor       | yes                |
| Entrypoint moved under `src/skills` for F-16          | minor       | yes                |
| Semantic injection narrowed structurally for doc-lint | minor       | yes                |

## Gate Results

### Static Gates

| Gate          | Result | Evidence                                     |
| ------------- | ------ | -------------------------------------------- |
| scoped check  | PASS   | 84 files, 0 findings via `run-deno-check.ts` |
| scoped lint   | PASS   | 84 files, 0 findings via `run-deno-lint.ts`  |
| scoped fmt    | PASS   | 84 files, 0 findings via `run-deno-fmt.ts`   |
| focused tests | PASS   | 5/5 `skills_test.ts` tests                   |
| package tests | PASS   | 94/94 `packages/ai` tests                    |

### Fitness Gates

| Gate                         | Result | Evidence                                                                           |
| ---------------------------- | ------ | ---------------------------------------------------------------------------------- |
| F-1–F-5, F-8–F-12, F-14–F-19 | PASS   | `check-doctrine.ts --root packages/ai`: `FAIL=0 WARN=0 INFO=0`                     |
| F-6 gate:jsr                 | PASS   | `deno task publish:dry-run`: exit 0, `Success Dry run complete`, no slow-type flag |
| F-7 docs                     | PASS   | raw `deno doc --lint packages/ai/src/skills/mod.ts`: exit 0                        |
| F-13 lifecycle               | N/A    | no cache, timer, handle, or long-lived resource                                    |

### Runtime and Consumer Gates

| Gate                    | Result | Evidence                                            |
| ----------------------- | ------ | --------------------------------------------------- |
| external runtime        | N/A    | effect-free caller-fed adapter; no backend          |
| `@netscript/ai` runtime | PASS   | root check and runtime tests in the 94-test suite   |
| `@netscript/ai/skills`  | PASS   | direct check/doc-lint and focused tests; 16 exports |

## Handoff Notes

- Evaluator should first inspect the two-phase source boundary and zero-embedding-call tests.
- PLAN-EVAL was owner-waived; IMPL-EVAL remains a separate-session orchestrator responsibility.
