# Plan: #309 release engineering and API-stability gates

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-309-release-api-stability-gates--codex` |
| Branch | `feat/309-release-api-stability-gates` |
| Phase | `plan` |
| Target | Release infrastructure, CI, and versioning doctrine |
| Archetype | `6 - CLI / Tooling` (gate/tool behavior only) |
| Scope overlays | `docs` |

## Archetype

Archetype 6 is the closest fit because the deliverables are user-run Deno commands and CI tooling.
The package-internal folder-shape rules are not applied to `.llm/tools`; the relevant Archetype 6
constraints are thin CLI parsing, deterministic application logic, explicit filesystem/process
edges, semantic tests, and finite exit/verdict vocabulary.

## Current Doctrine Verdict

The package verdict table is informational because package source is unchanged. A1/A14 make the
published surface a contract and require executable export/docs audits. `02-public-surface.md` is
the current versioning authority; no `10-versioning-*` doctrine file exists.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The new snapshot treats public declarations as designed contracts. |
| A2 | Stable, experimental, and deprecated states must be explicit at the boundary. |
| A7 | The implementation uses Deno's native `doc --json` and workspace primitives. |
| A14 | Version residue and surface compatibility become executable release gates. |

## Goal

Make beta release versioning zero-residue, add a deterministic CI-ready public-surface classifier,
define machine-readable deprecation removal policy, and harden release completion wording without
performing a cut or publish.

## Scope

- Unify `version:bump` and `release:cut` on the same coordinator; update root, all real workspace
  manifests, scaffold manifests, and lock mirror entries with no old-version residue.
- Add normalized Deno-doc snapshot generation/diffing, baselines, explicit major declarations,
  synthetic classifier tests, root task, and a package-path-filtered non-blocking PR workflow.
- Document `@deprecated{removal: x.y}` and warn when current root major/minor is at or past removal.
- Update the canonical release skill, regenerate its Claude mirror, and validate both surfaces.

## Non-Scope

- No actual release cut, GitHub Release, JSR publish, or production E2E.
- No blocking stable-line CI flip; #309 remains open.
- No package public API changes and no baseline auto-refresh in CI.
- No PR creation or issue closure.

## Hidden Scope

- Multi/subpath exports must remain distinct in snapshots.
- Changed interface/class/type definitions must count as major, not only function changes.
- Baseline generation must be path-stable across worktrees.
- `deno.lock` must remain byte-for-byte unchanged in this implementation worktree.

## Locked Decisions

| ID | Decision | Rationale |
| --- | -------- | --------- |
| D1 | Place tool, tests, declarations, and baselines under `.llm/tools/release/`. | The gate is CI/release fitness infrastructure, not public product tooling. |
| D2 | Reuse publishable-member discovery from `publish-workspace.ts`. | One definition of the packages the release publishes. |
| D3 | Store normalized Deno-doc schema rather than raw location-heavy output. | Makes baselines deterministic across native worktrees while retaining public definitions. |
| D4 | Keep allowed-major declarations separate from snapshots and require symbol/export matching plus a reason. | Refreshing a baseline must not implicitly approve a major. |
| D5 | Classify removal/signature change as major, addition as minor, no signature delta as patch. | Matches the slice acceptance contract. |
| D6 | Add a dedicated `surface-diff.yml` with PR `paths: packages/**` and step-level `continue-on-error: true`. | CI-ready beta observation without claiming stable enforcement. |
| D7 | Put deprecation convention in doctrine file 02. | That is the existing stability/versioning authority. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Flip surface-diff to blocking | safe to defer | Stable-line work remains on #309. |
| Expand baselines to non-publishable members | safe to defer | Acceptance names publishable `@netscript/*` packages. |
| Enforce missing removal metadata | safe to defer | This slice warns only when declared removal has passed. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Deno-doc JSON contains volatile locations/resolution paths. | Normalize and fixture-test stripped fields. |
| Equivalent types render differently after refactors. | Prefer semantic `def` content with volatile keys removed; rollout is non-blocking. |
| Baseline is too large/noisy. | Store only package/export/symbol normalized declarations and deprecation removal. |
| Bump test passes on a toy subset. | Build fixture from all root workspace pattern classes and assert every discovered file plus all lock mirrors. |
| Skill mirror is edited manually. | Change `.agents` only, run sync task, then check and validate. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | risk | Keep parsing, normalization, comparison, and CLI functions bounded and tested. |
| AP-11 | risk | Keep process/filesystem effects at explicit functions; classifier stays pure. |
| AP-18 | risk | Assert semantic classified changes, not whole-output string snapshots. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-5 | yes | Deno-doc snapshots cover every publishable package/export. |
| F-6/F-7 | N/A | Package publish/docs content is unchanged. |
| F-10 | yes | Focused coordinator and classifier tests. |
| F-19 | yes | Scoped check/lint/fmt wrappers over touched TypeScript roots. |
| Docs overlay | yes | Source alignment, local links, terminology, drift log. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | Stable-line blocking rollout already remains tracked by issue #309; no doctrine violation is introduced. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Unit | focused Deno tests for bump coordinator and surface classifier | PASS |
| 2 | Verdict proof | run surface tool against two local synthetic snapshots | expected major nonzero and declared-major zero paths |
| 3 | Scoped static | check/lint/fmt wrappers on `.llm/tools/release` and `.llm/tools/deps` | PASS |
| 4 | Live surface | `deno task surface:diff` against committed baseline | patch/no undeclared major |
| 5 | Lock hygiene | raw git diff/status for `deno.lock` | unchanged |
| 6 | Skill mirror | sync, sync-check, and Claude surface validator | PASS |
| 7 | IMPL-EVAL | separate Claude/Anthropic session | PASS or fix loop |

## Drift Watch

- Deno-doc schema/version differences, unexpected package discovery, baseline size, coordinator
  ownership changes, CI workflow trigger conflicts, or missing evaluator/runtime identity.
