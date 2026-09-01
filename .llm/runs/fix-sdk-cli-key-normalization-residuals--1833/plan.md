# Plan: residual Aspire key-normalization mismatches (#1833)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sdk-cli-key-normalization-residuals--1833` |
| Branch | `fix/sdk-cli-key-normalization-residuals` |
| Phase | `plan` |
| Target | `packages/sdk`, `packages/aspire` contract pin, and `packages/cli` deploy prebuild |
| Archetype | `2 — Integration` (SDK/Aspire); `6 — CLI/Tooling` (CLI) |
| Scope overlays | `frontend` (browser/Vite environment contract) |

## Archetype

`packages/sdk` and `packages/aspire` remain Archetype 2 integrations; `packages/cli` remains
Archetype 6. This slice changes an existing browser key policy and a deploy feature seam without
changing package shape, ports, adapters, command vocabulary, or composition.

## Current Doctrine Verdict

All three packages are `Keep`: preserve SDK discovery/client/cache boundaries, Aspire's
SDK-independent contribution helpers, and the CLI kernel/surface split.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | Tests state the cross-package key contract before implementation. |
| A6 | The existing normalization helper and Aspire key builder are reused; no new regex copy. |
| A8 | The CLI test seam stays with the deploy-build feature. |
| A14 | Character-sweep pins and focused gates preserve the behavior. |

## Goal

Make SDK shorthand and CLI deploy-prebuild browser keys agree with Aspire for the full invalid
identifier corpus while preserving #1831 full-key output and raw server keys.

## Scope

- Add failing agreement and CLI prebuild tests, including all ASCII punctuation in leading,
  embedded, and trailing positions; underscores, whitespace, empty input, and leading digits.
- Reuse SDK's existing browser normalizer for shorthand.
- Reuse Aspire's existing `buildViteEnvVarName()` in CLI prebuild and inject both full and shorthand
  keys for enabled services/plugins.
- Add an explicit raw server-key regression guard and retain browser full→short→server ordering.

## Non-Scope

- No changes to `packages/sdk/src/discovery/service-url.ts`.
- No changes to #1831 full-key behavior or Aspire normalization behavior.
- No runtime Aspire/Docker execution, deploy command vocabulary, export maps, dependencies, or
  lifecycle labels.
- IMPL-EVAL is supervisor-dispatched after handoff; this session will not self-evaluate.

## Hidden Scope

- A pure CLI prebuild-environment builder is required so the deployment injection contract can be
  tested without starting a process or runtime.
- Run artifacts and PR phase comments are part of the harness commit trail.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | SDK shorthand calls the existing private `normalizeViteIdentifierSegment()`. | Preserves one SDK browser rule and the #1831 full-key implementation. |
| D2 | CLI imports `buildViteEnvVarName()` from `@netscript/aspire/application`. | Uses the contract source and avoids another normalization copy or new public SDK export. |
| D3 | Server keys remain raw and receive an explicit regression test. | Aspire server output genuinely preserves hyphens. |
| D4 | PLAN-EVAL is N/A. | The issue is mechanical and fully specifies contract, scope, risks, and gates. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Normalization ownership | resolved now | D1/D2 lock the two existing sources; no new rule copy. |
| Runtime validation | safe to defer | Explicit owner constraint says no runtime; pure injection tests prove this slice. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A corpus that misses underscore multiplicity | Include `a--b`, consecutive underscores, and every punctuation position. |
| Accidental server normalization | Do not edit `service-url.ts`; assert the exact hyphenated server key. |
| CLI injects only one alias or includes disabled plugins | Assert exact environment output for services plus enabled/disabled plugins. |
| Public-surface or lock churn | Use existing imports/exports, inspect `deno.lock` and the final diff. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-2 | risk | Reuse the existing SDK normalizer and Aspire builder; add no regex wrapper/copy. |
| AP-9 | risk | Keep one exact rule rather than configurable normalization flags. |
| AP-18 | avoided | Assert semantic key/value maps rather than generated-output snapshots. |
| AP-25 | avoided | Test a pure builder; process execution remains at the existing CLI edge. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-2 | yes | Diff review shows no new normalization implementation. |
| F-3/F-19 | yes | Scoped structured check/lint/fmt wrappers pass. |
| F-10 | yes | Focused structured SDK/Aspire/CLI tests pass. |
| F-CLI-* applicable subset | yes | `arch:check` plus manual diff review; no structural CLI changes. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing CLI/SDK/Aspire debt | none | No debt is created, deepened, or closed. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED | structured focused test wrapper over new SDK/CLI tests | non-zero with shorthand and skipped-full-key mismatches |
| 2 | Focused tests | structured wrapper for SDK discovery, Aspire application tests, CLI deploy-build tests | exit 0 |
| 3 | Scoped static | structured check/lint/fmt wrappers on owned TypeScript | exit 0 |
| 4 | Repo check | `deno task check` | exit 0, `failedBatches: 0` |
| 5 | Quality | `deno task quality:scan` | exit 0 |
| 6 | Doctrine | `deno task arch:check` | exit 0 |

## Drift Watch

- Any need to change `service-url.ts`, export maps, dependencies, lockfiles, or normalization output
  beyond the issue corpus requires rescope.

