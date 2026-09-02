# Plan: declare the plugin-streams-core dependency

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-declare-streams-core-dependency--1543` |
| Branch | `chore/declare-streams-core-dependency` |
| Phase | `plan` |
| Target | `packages/plugin-workers-core`, `plugins/triggers` |
| Archetype | `3 - Runtime/Behavior`; `5 - Plugin Package` |
| Scope overlays | none |

## Archetype

`packages/plugin-workers-core` is Archetype 3 because it owns worker runtime behavior.
`plugins/triggers` is Archetype 5 because it is a first-party plugin. This slice changes only their
dependency declarations and does not alter either package shape.

## Current Doctrine Verdict

Both surfaces are `Refactor`: workers-core should reduce contract/domain cardinality, while the
triggers connector should complete thinness. Those remediations are unrelated and unchanged.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A9 | The manifests remain consistent with their existing package/plugin shapes. |
| A14 | Publish and static gates verify the manifest-only change. |

## Goal

Declare the already-consumed workspace dependency in both owning manifests using the established
exact JSR specifier.

## Scope

- Add `@netscript/plugin-streams-core` to the imports maps in the two named manifests.
- Cycle 2: add the same declaration to the four remaining importing workspace members:
  `packages/sdk`, `packages/plugin-sagas-core`, `packages/plugin-auth-core`, and `packages/cli/e2e`.
- Retain `deno.lock` only if Deno resolution genuinely changes it.
- Preserve and update this run directory.

## Non-Scope

- TypeScript source, `plugins/workers`, dependency versions, new fitness checks, existing doctrine
  debt, and sibling leaf areas.
- Release-integrity remediation: base publishing already succeeds silently.

## Hidden Scope

- Derive the complete workspace static import/export edge set separately from string references.
- Verify the evaluator-versus-owner disagreement for `packages/cli/e2e` from source syntax.
- Prove whether the lockfile moves after the declarations.
- Run the four generated-corpus freshness checks because manifest metadata feeds generated output.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Add the dependency to both manifests. | Direct imports should be readable from each member manifest even though workspace resolution silently accepts omission. |
| D2 | Use `jsr:@netscript/plugin-streams-core@0.0.6`. | Exact match to `plugins/workers/deno.json`. |
| D3 | Do not add an undeclared-import gate. | Publishing is unaffected; acceptance box 3 is conditional and N/A. |
| D4 | Declare the dependency in all four remaining importing workspace members. | Owner-authorized cycle-2 fix closes the completeness gap; CLI E2E has five genuine static imports despite being non-publishable. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Dependency declaration outcome | resolved | Owner locked the additive consistency change. |
| New fitness check | safe to defer | Explicitly out of scope and unnecessary for a non-publish-blocking inconsistency. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Resolution changes `deno.lock`. | Inspect exact diff and retain only genuine resolution movement. |
| Generated metadata becomes stale. | Run all four generated-corpus `check:` variants. |
| Existing workspace changes enter the commit. | Use raw git status and explicit path staging. |
| String references are mistaken for dependency edges. | Count only static import/export module specifiers; report strings separately. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-14 | risk avoided | Make dependency reuse explicit; do not redefine any core contract. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-3/F-5/F-6/F-19 | yes | `arch:check`, publish dry-run, root and scoped wrapper gates |
| Other Archetype 3/5 gates | N/A to diff | No source, export, runtime, permission, or test-shape change. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing workers-core/triggers debt | none | This slice neither creates nor resolves architecture debt. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Baseline publish | `deno task publish:dry-run` | exit 0; silent acceptance confirmed |
| 2 | Root static | `deno task check` | exit 0 |
| 3 | Scoped static | check/lint/fmt wrappers over both roots | exit 0 each |
| 4 | Architecture | `deno task arch:check` | exit 0 |
| 5 | Generated corpus | four generated-corpus `check:` tasks | exit 0 each |
| 6 | Final publish | `deno task publish:dry-run` | exit 0 |

## Dependencies

- Existing workspace member and published package `@netscript/plugin-streams-core@0.0.6`.

## Drift Watch

- Any lockfile movement, generated output drift, source change, or gate failure.
- Any importing member missing from the workspace-wide static-edge census.
