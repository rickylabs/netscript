# Plan: `@netscript/ai/skills`

## Run Metadata

| Field          | Value                          |
| -------------- | ------------------------------ |
| Run ID         | `feat-246-skill-loader--codex` |
| Branch         | `feat/246-skill-loader-port`   |
| Phase          | `plan`                         |
| Target         | `packages/ai`                  |
| Archetype      | `2 - Integration`              |
| Scope overlays | none                           |

## Archetype

Archetype 2 is the smallest fit: the loader consumes two explicit external capabilities
(`SkillContentSource` and optional `EmbeddingProviderPort`) and ships an in-memory adapter. It owns
no lifecycle, persistence, network, filesystem, or UI behavior.

## Current Doctrine Verdict

The doctrine inventory predates `packages/ai`, so there is no package-specific verdict. New code is
bound immediately by the Archetype 2 rules: public types first, role layering, injected boundaries,
effect-free core, and JSR-clean exports.

## Axioms in Play

| Axiom  | Why it matters                                                                     |
| ------ | ---------------------------------------------------------------------------------- |
| A1/A2  | The four-operation loader and disclosure tiers are designed before implementation. |
| A5/A10 | A factory composes source + optional embeddings; no inheritance or container.      |
| A6/A7  | Parsing/matching helpers encode the blessed format and scoring policy only.        |
| A8/A9  | Files follow domain/ports/application/adapters within the existing package.        |
| A11    | The extension axes are content source and semantic embedding provider.             |
| A14    | Parser, disclosure, trigger, doc, and publish gates protect the contract.          |

## Goal

Publish a validated, effect-free `@netscript/ai/skills` loader that lists cheap summaries, loads
full bodies on demand, and matches by tags or optional embeddings.

## Scope

- Replace the provisional skill-loader contract with `list`, `load`, `matchByTag`, and
  `matchByQuery`.
- Parse blessed `SKILL.md` frontmatter (`id`, `name`, `tags`, `description`) and non-empty body.
- Add injected `SkillContentSource` plus caller-fed in-memory adapter.
- Add deterministic exact/substring tag ranking and optional cosine semantic ranking.
- Add parser, progressive-disclosure, and tag/semantic/combined unit tests.
- Add the `./skills` export and update package documentation/task entrypoints.

## Non-Scope

- Management UI, persistence, remote/git/fs sources, authoring approval gates (#271), plugin/AI
  scaffolding (#290), concrete embedding providers, orchestration wiring, or embedding caches.

## Hidden Scope

- Preserve the existing `@netscript/ai/ports` path by re-exporting the replacement port contract.
- Ensure list/match paths never call the source's full-body read unless a caller calls `load`.
- Update the package-local check task so the new subpath is directly checked.

## Locked Decisions

| ID | Decision                                                                                                               | Rationale                                                                                  |
| -- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| D1 | `SkillContentSource.list()` returns summaries and `load(id)` returns raw markdown.                                     | Makes two-phase reads observable and prevents eager body access by construction.           |
| D2 | Parser accepts a strict YAML-compatible subset: scalar id/name/description and bracket/list tags; unknown keys reject. | Blessed fields stay deterministic without adding a YAML runtime dependency.                |
| D3 | Tag matching is case-insensitive: exact = 1, substring = 0.5; results sort score-desc then id.                         | Stable, explainable ranking with exact preferred.                                          |
| D4 | Semantic matching embeds query + `name\ndescription\ntags`, uses cosine similarity, and is opt-in.                     | Summaries remain cheap; body is not disclosed for matching.                                |
| D5 | Combined query score is the maximum of tag and semantic scores, with match modes recorded.                             | A strong exact trigger is not diluted by vector similarity and duplicate results collapse. |
| D6 | Missing embedding provider degrades to tag-only; semantic disabled performs zero embedding calls.                      | Matches issue acceptance and preserves optionality.                                        |

## Open-Decision Sweep

| Decision                               | Status        | Notes                                                              |
| -------------------------------------- | ------------- | ------------------------------------------------------------------ |
| Weighting/calibration beyond max-score | safe to defer | Requires consumer evidence; public result exposes score/modes.     |
| YAML features beyond blessed fields    | safe to defer | The standard intentionally validates a small deterministic schema. |
| Embedding cache/lifecycle              | safe to defer | No cache ships, so F-13 lifecycle concern is N/A.                  |

## Risk Register

| Risk                                              | Mitigation                                                                                                      |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Parser silently accepts malformed metadata        | Reject missing fences/fields, unknown keys, malformed tags, duplicates, and empty body; test edges.             |
| Progressive disclosure is only nominal            | Separate source methods and spy tests proving list/match do not invoke full load.                               |
| Semantic dimensions or zero vectors break scoring | Validate equal non-empty dimensions; cosine returns zero for zero magnitude.                                    |
| Existing consumers use provisional names          | Keep the contract exported from `@netscript/ai/ports`; no repository consumer currently references old methods. |

## Anti-Patterns to Resolve or Avoid

| AP          | Status | Plan                                                                         |
| ----------- | ------ | ---------------------------------------------------------------------------- |
| AP-3        | risk   | Keep both ports limited to issue-owned operations.                           |
| AP-8/AP-9   | avoid  | One explicit factory/options object; no container or mode-switch adapter.    |
| AP-11/AP-25 | avoid  | No module-time state or I/O; caller-fed adapter only.                        |
| AP-17/AP-22 | avoid  | Use `ports/`; `src/skills/mod.ts` is the documented public subpath manifest. |

## Fitness Gates

| Gate                                      | Required | Expected evidence                                                      |
| ----------------------------------------- | -------- | ---------------------------------------------------------------------- |
| F-1/F-3/F-5/F-10/F-11/F-12/F-14/F-18/F-19 | yes      | scoped wrappers, tests, `arch:check`, manual surface review            |
| F-2/F-4/F-8/F-9/F-15/F-16/F-17            | yes      | doctrine checker/manual inspection; no new violation                   |
| F-6/F-7                                   | yes      | full export doc-lint and root publish dry-run without slow-type waiver |
| F-13                                      | N/A      | no long-lived resource or cache is created                             |

## Arch-Debt Implications

| Entry | Action | Notes                                     |
| ----- | ------ | ----------------------------------------- |
| none  | none   | No new or deepened doctrine debt planned. |

## Validation Plan

| Order | Gate     | Command or check                                | Expected result                    |
| ----- | -------- | ----------------------------------------------- | ---------------------------------- |
| 1     | unit     | `deno test packages/ai/tests/skills_test.ts`    | parser/disclosure/matching green   |
| 2     | static   | scoped check/lint/fmt wrappers on `packages/ai` | PASS                               |
| 3     | package  | `deno task --cwd packages/ai test`              | all AI tests green                 |
| 4     | layering | `deno task arch:check`                          | includes and passes `packages/ai`  |
| 5     | docs     | doc-lint runner on `packages/ai`                | all entrypoints clean              |
| 6     | gate:jsr | `deno task publish:dry-run`                     | green without `--allow-slow-types` |

## Dependencies

- Existing `EmbeddingProviderPort` from `packages/ai/src/ports/embedding.ts`.
- `@std/assert` for tests only; no new production dependency.

## Drift Watch

- Any need for full bodies during list/match, a parser dependency, cache lifecycle, or source I/O.
