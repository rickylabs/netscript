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

| # | Slice                                                          | Gate                                                   | Files                                                                                                     |
| - | -------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| 1 | Proves the validated two-tier loader and trigger contract      | targeted unit + scoped check                           | `packages/ai/skills.ts`, `packages/ai/src/skills/**`, replacement port, `deno.json`, tests, run artifacts |
| 2 | Proves package layering, documentation, and JSR publishability | scoped lint/fmt, full AI tests, arch/doc/publish gates | fixes from gates, README, run artifacts                                                                   |

### Deferred Scope

- UI, persistence, fs/git/network sources, authoring approval, scaffolding, orchestration, concrete
  embeddings, and caching — explicitly owned by later/app slices.

### Contributor Path

Start at `packages/ai/skills.ts` for the curated contract, add content-source technologies as named
adapters implementing `src/skills/ports/skill-content-source.ts`, and keep selection policy in
`src/skills/application/` without importing adapters.

## Progress Log

| Time       | Slice | Step     | Notes                                                                               |
| ---------- | ----- | -------- | ----------------------------------------------------------------------------------- |
| 2026-07-11 | plan  | complete | Issue read fully; baseline verified; package mapping and placeholder port recorded. |

## Decisions

| Decision               | Reason                                                           | Source                  |
| ---------------------- | ---------------------------------------------------------------- | ----------------------- |
| Owner-waived PLAN-EVAL | Explicit slice brief; carried drift D1.                          | user brief / `drift.md` |
| Archetype 2            | Two injected external capability seams and an in-memory adapter. | doctrine / issue #246   |

## Drift

| Drift                                | Severity    | Logged in drift.md |
| ------------------------------------ | ----------- | ------------------ |
| PLAN-EVAL owner-waived               | significant | yes                |
| Old issue path maps to `packages/ai` | minor       | yes                |

## Gate Results

Pending implementation.

## Handoff Notes

- Evaluator should first inspect the two-phase source boundary and zero-embedding-call tests.
