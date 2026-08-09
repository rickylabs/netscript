# Plan: #1356 resolve every UI command to a Fresh app root

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.5--orchestration/slices/cli-1356` |
| Branch | `fix/ui-commands-resolve-app-root` |
| Phase | `plan` |
| Target | `packages/cli` command resolution + its E2E gate |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none; command routing only, no Fresh UI implementation/content change |

## PLAN-EVAL

`PLAN-EVAL: N/A` — mechanical change. The live issue fixes the resolution order, public flag,
ambiguity behavior, gate correction, docs truth surface, negative-test shape, and boundaries. The
current code exposes one obvious injected resolver seam and leaves no architecture, sequencing, or
product trade-off open. Mandatory separate-session IMPL-EVAL remains owner-controlled.

## Archetype and Doctrine

Archetype 6 applies because `@netscript/cli` ships the public command flow. The current doctrine
verdict is **Restructure**, but doctrine file 10 explicitly forbids stopping feature work for that
global migration. This slice stays inside the existing vertical `public/features/ui` feature and
puts filesystem policy in kernel application code with an injected filesystem port.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A2 | Ambiguous multi-app selection fails rather than hiding a write target. |
| A6 | One shared resolver is justified by five commands and is directly tested. |
| A8 | App-root policy belongs in the UI application feature, not repeated presentation handlers. |
| A10 | Public composition injects cwd/path/filesystem adapters into the resolver. |
| A14 | Behavioral negatives and the corrected standing E2E gate preserve the contract. |

## Scope

- Add one shared UI app-root resolver for explicit app paths, named apps, current-app inference,
  single-app inference, and enumerated ambiguity errors.
- Route `ui:init`, `ui:add`, `ui:list`, `ui:update`, and `ui:remove` through it and add `--app` to
  each help surface.
- Complete `UiAddCommandInput` for every accepted option.
- Correct `ui-ai-gates.ts` so installation starts from the generated workspace, targets the named
  Fresh app, and all assertions run from `apps/dashboard`.
- Add focused behavioral tests including a scratch old-layout E2E discriminator.
- Verify the two existing how-to pages already match; edit only if a concrete mismatch appears.

## Non-Scope

- Dynamic app-name derivation (#1333), page content (#1357), `--force`/`--dry-run` additions
  (#1354/#1357), conformance inventory (#1335), or unrelated CLI restructure/debt.
- AppHost, containers, or any `e2e:cli` runtime invocation without a serialized token.
- Changing the generic deploy/project resolver used by non-UI commands.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | `--project-root` remains an explicit app-directory escape hatch and wins when supplied. | Live issue explicitly accepts a project root pointing at an app. |
| D2 | Otherwise resolve workspace, enumerate direct `apps/<name>` members, then apply: explicit `--app` → current directory inside a candidate → sole candidate → enumerated error. | Satisfies all four behavioral rows without silent choice. |
| D3 | App names are workspace-path basenames; candidate output is deterministically sorted. | Matches documented `--app dashboard` and makes errors stable/testable. |
| D4 | Resolution is a kernel application function consuming `FileSystemPort` and injected cwd/workspace-root functions. | Keeps filesystem effects at adapters/composition and shares policy across five handlers. |
| D5 | The E2E gate uses `ASPIRE_RESOURCE.APP`, invokes `ui:add` from the generated workspace, and runs all UI assertions from that app root. | Reuses the suite's locked default-app constant and makes old workspace writes fail. |
| D6 | Existing docs remain byte-unchanged if verification shows they already state the shipped flag and app paths. | Avoids unrelated prose churn while truthfully satisfying the docs row. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Full runtime execution | safe to defer | Owner/CI owns serialized runtime evidence; local run is prohibited. |
| Supporting nested/glob app members | safe to defer | Issue contract is direct `apps/<name>` members; broader workspace discovery is separate scope. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A shared resolver still lets one command bypass it. | Help and behavioral tests cover all five registrations; review command diffs together. |
| Gate assertions are merely moved and still accept old layout. | Run the actual generated gate command against an old-layout scratch: require non-zero, then app-layout zero. |
| Multi-app error omits useful names or returns zero. | Spawn the real CLI boundary in a temp workspace and assert non-zero plus both candidates and `--app`. |
| App-relative local-source paths break. | Update the E2E local-source base to `../../packages` and test gate command/cwd construction. |
| Existing CLI doctrine debt is deepened. | No new abstract/base/registry; run scoped wrappers, `quality:scan`, and `arch:check`. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-2/AP-6 | risk | Use one function, no wrapper/base-class hierarchy. |
| AP-11/AP-25 | risk | Inject filesystem and cwd; no `Deno.*` in command handlers/application policy. |
| AP-18 | risk | Assert semantic destinations, candidate names, exit codes, and gate cwd rather than snapshots. |
| AP-21 | existing | Keep files within the current UI vertical feature; do not widen restructure scope. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| CLI Restructure / A6 pending scripts | none | Existing debt is neither closed nor deepened. |

## Commit Slices

| # | Slice | Proving gate | Files |
| --- | --- | --- | --- |
| 0 | Bootstrap current research/design and record PLAN-EVAL N/A. | artifact review; clean baseline | this run directory |
| 1 | Resolve every UI command to an app and make the corrected E2E gate reject the old layout. | focused UI/E2E tests; help probes; scoped wrappers; quality/arch gates | `packages/cli/src/kernel/application/ui/**`, `packages/cli/src/public/features/ui/**`, root dependency/tree wiring, `packages/cli/e2e/src/application/gates/scaffold/ui-ai-gates*`, run artifacts |

## Validation Plan

| Order | Gate | Command/check | Expected result |
| --- | --- | --- | --- |
| 1 | Pre-fix behavioral RED | focused new UI resolution + E2E gate tests before source changes | exit 1, naming each old behavior |
| 2 | Focused tests | `deno test --no-lock --allow-all <owned UI tests> <ui-ai-gates_test.ts>` | all pass |
| 3 | Public help | run all five local public `ui:* --help` commands | exit 0; every output contains `--app <name>` |
| 4 | Scoped check/lint/fmt | repo wrappers over `packages/cli` and `packages/cli/e2e`, TS/TSX only, check with `--no-lock` + `--unstable-kv` | exit 0 |
| 5 | Quality scan | `deno task quality:scan` | exit 0; aggregate recorded honestly |
| 6 | Doctrine | `deno task arch:check` | exit 0 or only byte-identical pre-existing debt, recorded |
| 7 | Runtime | not run locally | token not granted; owner CI supplies exact one-pass evidence before closure |

## Drift Watch

- Any need to change docs, generic project resolution, workspace discovery beyond direct apps,
  app naming, generated UI content, or an AppHost-backed gate is significant drift and stops scope.

