# Plan: adopt the 0.0.x release scheme repo-wide

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `version-scheme-0-0-x` |
| Branch | `chore/version-scheme-0-0-x` |
| Phase | `plan` |
| Target | Cross-cutting release tooling, publishable metadata, docs, skills, workflows, and resources |
| Archetype | Multi-surface: existing package archetypes; Archetype 6 for CLI/tooling paths |
| Scope overlays | `SCOPE-docs` |

## Archetype

This is one sequential cross-cutting run, not a package redesign. Existing touched packages retain
their doctrine archetypes: integration/runtime metadata stays inside its current package boundary,
plugin metadata stays Archetype 5, Fresh UI stays Archetype 4, and CLI/release tooling uses
Archetype 6. The union gate set is used; no new folder shape, command, export, or abstraction is
introduced.

The owner requires one branch and one PR. Slices are sequential because the final census,
generated-asset pipeline, release skill, and dry-run proof all share the same release contract; a
supervisor/sub-PR split would add conflict and violate the requested deliverable shape.

## Current Doctrine Verdict

The doctrine records mixed existing verdicts: CLI is `Restructure`, Fresh UI is `Keep`, telemetry is
`Refactor`, and plugin packages range from `Keep` to `Refactor`. This run does not claim to resolve
those structural verdicts. It must not deepen them; it only removes stale version coupling or routes
exact metadata through existing generated constants.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1/A2 | Published exact-version behavior must be explicit and simple at the consumer boundary. |
| A6 | Reuse existing release constants and generation instead of adding wrappers. |
| A8 | Remove dead references rather than preserving stale commentary. |
| A9 | Keep changes inside each package's current archetype boundary. |
| A14 | `release:cut --dry-run`, publish readiness, scoped wrappers, tests, and docs links prove the result. |

## Goal

Adopt the owner-ratified `0.0.x` release train so normal releases use `0.0.x`, canaries use
`0.0.x-canary.N`, unnecessary exact references disappear, stage-only prose stops naming a release,
and every remaining mutable exact version is moved by `release:cut`.

## Scope

- Triage every baseline occurrence into Tier 1, Tier 2, Tier 3, or owner-exempt historical evidence.
- Remove dead exact-version prose and fixtures; use stage words only where maturity is the point.
- Derive exact runtime/publish metadata from the generated package-version pipeline.
- Update release/process skills, regenerate `.claude/skills`, and update current roadmap/milestone
  language for the already-renamed `0.0.2`…`0.0.9` milestones.
- Update docs/site, root/package READMEs, workflows, and resources where the old scheme is current
  product language rather than history.
- Verify release tooling has no prerelease-train assumption while preserving stable-only target
  validation.
- Produce the exhaustive final Tier 3 mechanism list and before/after counts in the PR body.

## Non-Scope

- No `deno.json` version bump; all manifests remain `0.0.1-beta.12` until release cut.
- No milestone rename, history rewrite, tag move, publish, or merge.
- No edits to immutable release history in CHANGELOGs, incident evidence, or `.llm/runs` history.
- No publish-config edits under `packages/bench` or `packages/cli/e2e`.
- No unrelated doctrine remediation.

## Hidden Scope

- Generated `.claude/skills` mirror changes must come only from `agentic:sync-claude`.
- Two lockfiles and scaffold plugin manifests are Tier 3 even though this branch intentionally leaves
  their old version literals intact.
- Generated assets may fail freshness gates until their intended diff is committed.
- Tests that use version-shaped sample data need semantic triage, not mechanical replacement.
- The final dry-run mutates release-owned files and generated assets; capture evidence, then restore
  only that known dry-run diff without discarding owned changes.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Count all 325 occurrences, but report the reducible remainder separately. | Raw majority reduction is impossible because 258 occurrences are already release-cut-owned Tier 3. |
| D2 | Historical published-version evidence remains literal and is classified as owner-exempt history, not mutable Tier 3. | Rewriting it would falsify incidents/releases. |
| D3 | Exact runtime/package metadata derives from existing generated metadata; extend `gen:publish-assets` only when no existing constant covers the package. | This is the #991 prevention boundary. |
| D4 | Scenario-only test versions become neutral fixtures; lockstep tests use the release constant. | Tests should assert semantics, not freeze yesterday's train. |
| D5 | Current maturity prose may say beta/pre-1.0 without an exact release. | Tier 2 carries the intended meaning without a maintenance burden. |
| D6 | Keep `validateStableTarget` strict. | All future targets are normal `0.0.x` versions; strictness is now aligned. |
| D7 | Use one branch/PR with ordered slices. | Owner deliverable and shared release contract make sub-PR fanout counterproductive. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Add new generated metadata constants for packages without one | Must resolve now | Decide per exact source site during Slice 2; do not leave a hardcoded replacement. |
| Preserve or remove each beta-numbered doc statement | Must resolve now | Classify from whether the number is current contract, stage signal, or historical fact. |
| Permanent machine-readable tier inventory | Safe to defer | Final PR table is required; automation is added only if existing gates leave a recurring blind spot. |
| Full CLI runtime E2E | Safe to defer unless generated output changes | The canonical release dry-run and targeted CLI tests are primary; scaffold.runtime is required if emitted scaffold behavior changes. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Blind replacement corrupts history or fixtures. | Site-by-site tier inventory; diff review; historical exclusions. |
| A surviving exact source literal is not bumped. | Trace each Tier 3 site to `coordinateVersionBump`, `gen:publish-assets`, or a derived constant; prove with release dry-run. |
| Root wrappers miss CLI files. | Run explicit scoped check/lint/fmt wrappers for every touched package root, especially `packages/cli`. |
| Generated asset diff blocks freshness checks. | Commit generated outputs before rerunning freshness gates. |
| Dry-run leaves manifests bumped. | Snapshot raw status/diff, run dry-run, capture readiness JSON, restore only files proven to be dry-run outputs, then recheck status. |
| Docs claims diverge across roadmap, site, README, and skills. | One terminology sweep plus `docs:links` and opposite-family review. |
| Existing architecture debt creates unrelated red gates. | Report real failures; distinguish baseline debt only with evidence, never suppress. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-2/A6 | Risk | Reuse generated constants; do not invent a version helper. |
| AP-5 | Existing risk | Remove dead/stage-only exact-version policy duplication. |
| AP-18 | Existing risk | Replace brittle exact-version fixture assertions only when the number is not the behavior under test. |
| AP-25 | Risk | Generation remains in existing tool edges; publishable runtime source only consumes constants. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-5/F-6/F-7 | Yes for touched publishable roots | JSR audit, doc-lint where exports/docs change, publish readiness/dry-run |
| F-19 | Yes | Scoped check/lint/fmt wrappers per touched root |
| Universal/affected archetype gates | Yes | `deno task quality:gate` plus manual no-surface-change review |
| Docs overlay | Yes | source alignment, terminology sweep, `deno task docs:links` |
| Skills mirror | Yes | `agentic:sync-claude:check` and `agentic:check-claude` |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing package verdicts | none | Do not deepen or claim closure. |
| New version-coupling debt | none allowed | A mutable exact literal without cut ownership is a slice failure. |

## Commit Slices

| # | Slice | What it proves | Primary gates | Planned files |
| --- | --- | --- | --- | --- |
| 1 | Release contract and process language | Skills/workflows/tooling describe `0.0.x` + tied canaries without obsolete prerelease-train guidance | targeted tests; skill sync/check; scoped fmt/check | `.agents/skills/**`, generated `.claude/skills/**`, `.github/workflows/**`, `.llm/tools/release/**` tests/docs, root process docs |
| 2 | Publishable exact-version derivation | Every mutable exact source/runtime metadata site is generated or constant-derived | package tests; scoped wrappers; `quality:gate`; publish-asset freshness | affected `packages/**`, `plugins/**`, `.llm/tools/generate-publish-assets.ts` if required |
| 3 | Consumer fixtures and current docs | Tests use semantic fixtures; current README/site/roadmap/resource prose follows Tier 1/2/3 policy | affected tests; `docs:links`; scoped wrappers | tests, `README.md`, `docs/**`, package READMEs, `resources/**`, RFC/process templates |
| 4 | Census and release-cut proof | Final tree has no unexplained survivor and `release:cut -- 0.0.2 --dry-run` reaches green publish readiness | full planned gates; dry-run; raw git restoration verification | run artifacts and PR body; no manifest version committed |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Census | exact `rg --json` inventory and survivor mechanism audit | Every match classified; counts reconcile |
| 2 | Static | scoped `run-deno-check/lint/fmt.ts --root <touched-root> --ext ts,tsx` | PASS for every changed TS root |
| 3 | Tests | targeted affected package/tool tests, then `deno task test` as required | PASS |
| 4 | Doctrine | `deno task quality:gate` | PASS or explicitly evidenced baseline failure |
| 5 | Docs | `deno task docs:links` | PASS |
| 6 | Skills | `deno task agentic:sync-claude:check`; `deno task agentic:check-claude` | PASS |
| 7 | Release | `deno task release:cut -- 0.0.2 --dry-run` | output contains `{"gate":"publish-readiness","ok":true}` and command completes |
| 8 | Restoration | raw `git status`, `git diff`, manifest-version census | no dry-run bump remains; owned diff preserved |

## Dependencies

- Existing `coordinateVersionBump`, `gen:publish-assets`, publish-readiness specifier/Markdown gates.
- Agentic local evaluator route and opposite-family review route.
- GitHub token and explicit-refspec push path.

## Deferred Scope

- Publishing `0.0.2`, canary dispatch, milestone changes, and merging the PR.
- Historical release normalization.
- Repo-wide architecture remediation unrelated to version coupling.

## Drift Watch

- Any exact survivor that cannot be tied to a cut-owned mechanism.
- Any generated asset not listed in `PUBLISH_ASSET_OUTPUTS`.
- Any gate that cannot run locally or produces baseline failures.
- Any count that fails to reconcile to the original 325 occurrences.
