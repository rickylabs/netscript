# Plan: adopt final plugin reference pages and enforce the denominator

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-adopt-plugin-pages-b--1857` |
| Branch | `docs/adopt-plugin-pages-b` |
| Phase | `plan` |
| Target | Three plugin reference pages plus docs export-drift tooling |
| Archetype | `5 - Plugin Package` (described surface only) |
| Scope overlays | `docs` |

## Archetype

Archetype 5 applies because the pages document first-party packages under `plugins/*`. This run
does not change their implementation; it checks their declared subpaths and symbol inventories as
published contracts. `SCOPE-docs` adds source-alignment, link, terminology, and drift obligations.

## Current Doctrine Verdict

- `plugins/auth`: Keep — remain thin glue over auth-core contracts and backends.
- `plugins/triggers`: Refactor — complete connector thinness without relocating core conventions.
- `plugins/workers`: Refactor — complete connector thinness and the jobs/worker contribution split.
- This slice neither closes nor deepens those implementation verdicts.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| `A1` | Public entrypoint and type claims must match the manifest and `deno doc`. |
| `A2` | Each published boundary must be explicit rather than inferred from prose. |
| `A9` | The auth hub must remain a cross-package information-architecture surface, not masquerade as one plugin page. |
| `A14` | The mapping and denominator check make documentation accuracy executable. |

## Goal

Reach an enforced `36/36` state: 35 package reference pages mapped with explicit symbol coverage,
and the auth multi-package hub recorded as the sole exclusion.

## Scope

- Add exact missing entrypoint rows to triggers and workers.
- Convert plugin-auth's export table to Export/Path/Purpose and add its two missing entrypoints.
- Add three cumulative mappings with measured `entrypoints-only` reasons.
- Add an exported typed auth-hub exclusion and an exactly-one mapped-or-excluded denominator check.
- Test uncovered and doubly classified reference pages.
- Regenerate docs-derived assets in the owner-specified order.
- Preserve and verify every pre-existing mapping name.

## Non-Scope

- No `plugins/*` or `packages/*` implementation/manifests.
- No auth hub prose or navigation rewrite.
- No changes to any of the five packages indexed by the auth hub.
- No full-symbol prose expansion; measured gaps are recorded honestly.

## Hidden Scope

- Generated agent-docs prose, assets barrels, publish assets, and provenance derived from
  `docs/site/**`.
- A regression test for the new denominator invariant.
- Base-relative whitespace, lock, exact status, and provenance ancestry checks.
- Independent reproduction of known `check:mcp-export-corpus` baseline #1668.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Map triggers, workers, and plugin-auth; exclude only auth. | Auth is a five-package hub; the other pages each own one manifest. |
| D2 | Use `entrypoints-only` for all three mappings. | Fresh `deno doc` unions leave gaps of 133, 50, and 79. |
| D3 | Insert into the current main mapping without replacing existing blocks. | Mapping removal silently weakens policing. |
| D4 | Put exclusion + denominator enforcement + tests in a second commit. | Owner requires independent reversibility. |
| D5 | Preserve `{{ releaseVersion }}` exactly. | The plugin-auth page is a Vento template. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Purpose wording for new rows | resolved | Grounded in per-entrypoint `deno doc` symbols; terse contract descriptions. |
| Complete vs entrypoints-only | resolved | All three gaps are nonzero. |
| PLAN-EVAL | safe to defer / N/A | The owner supplied a bounded contract, IA decision, commit boundary, and exact gates; no architectural choice remains. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Lose a pre-existing mapping during rebase/edit | Rebased first; insert blocks only; assert all 32 names by name. |
| Parser reads prose as path | Use the proven three-column shape with actual path in cell two. |
| False coverage claim | Record measured union/documented/gap and accurate omission categories. |
| New page bypasses policy | Discover physical reference indexes and reject neither/both classification. |
| Generator drift or orphaned provenance | Run generators in exact order and verify checks plus ancestry. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| `AP-1` | avoid | Keep denominator validation focused in the existing tool and extract a pure validator for tests. |
| `AP-9` | avoid | Do not invent a second mapping abstraction; extend existing mapping data. |
| `AP-14` | avoid | Describe real re-exported symbols; do not imply ownership or new upstream surface. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| `F-5` public surface | yes | `docs:exports-drift` and measured all-entrypoint `deno doc` unions. |
| `F-7` documentation | yes | Site build/source/link/caveat and repo docs accuracy/snippet/link gates. |
| `F-19` scoped runners | yes for touched tool test | `deno task test` structured wrapper. |
| Other Archetype 5 source gates | no | No plugin/package source is changed. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `plugins/triggers — doctrine verdict Refactor` | none | Documentation mapping does not remediate implementation shape. |
| `plugins/workers — doctrine verdict Refactor` | none | Documentation mapping does not remediate implementation shape. |
| `workers-private-type-ref-1655` | none | No API or doc-lint contract is changed. |
| `plugins/auth — AUTH-BACKEND-ENV-CENTRALIZATION` | none | Hub classification does not change backend contracts. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Export drift | `deno task docs:exports-drift` | 0, 35 mappings + one exclusion, `36/36` |
| 2 | Site gates | `deno task --cwd docs/site check:source-format`; `build`; `check:links`; `check:caveats` | all 0 |
| 3 | Repo docs gates | `deno task docs:links`; `docs:accuracy`; `docs:snippets` | all 0 |
| 4 | Generated corpus | `check:agent-docs-prose`; `check:assets-barrel`; `check:publish-assets` | all 0 |
| 5 | Generated typecheck | targeted `deno check --unstable-kv` | 0 |
| 6 | Test | `deno task test` | 0 |
| 7 | Hygiene | base-relative `git diff --check`, exact status, lock diff, provenance ancestry | clean/0 |
| 8 | Known baseline | `check:mcp-export-corpus` in clean `origin/main` worktree | reproduce #1668, do not attribute |

## Risks

- A final evidence-only commit changes the head after gates; therefore all required gates will be
  rerun at the final pushed head and the PR body will carry those exact exit codes.

## Dependencies

- Current `origin/main`, Deno 2.9 `deno doc --json`, existing docs generators, GitHub PR #1869.

## Drift Watch

- Mapping denominator/name changes, new physical reference pages, generated provenance changes,
  any `deno.lock` mutation, and external baseline failures.
