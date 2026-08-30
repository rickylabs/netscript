# Plan: Aspire 13.5 generator re-validation (S4)

## Run Metadata

| Field          | Value                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Run ID         | `chore-aspire-13-5-s4-generator-revalidation--impl`                                                                             |
| Branch         | `chore/aspire-13-5-s4-generator-revalidation`                                                                                   |
| Phase          | `implement`                                                                                                                     |
| Target         | `packages/cli`, `packages/config`, Aspire generator assets, deploy adapters                                                     |
| Archetype      | `6 — CLI / Tooling`, with the existing deployment seam checked against Archetype 7 rules; `packages/config` remains Archetype 1 |
| Scope overlays | none                                                                                                                            |

## Archetype

Archetype 6 is dominant because the slice validates generated AppHost output and CLI deploy
adapters. The deploy adapters remain the existing in-package Archetype 7 seed behind
`DeployTargetPort`; no port, router, command vocabulary, or extension axis changes. The config
default is a folded Archetype 1 contract edit.

## Current Doctrine Verdict

Both `packages/cli` (Archetype 6) and `packages/config` (Archetype 1) are `Keep`. Preserve the CLI
kernel/surface split and keep config schemas cohesive.

## Axioms in Play

| Axiom | Why it matters                                                                                                                            |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| A1/A2 | The config default and generated TypeScript call contract are consumer-visible contracts.                                                 |
| A6/A7 | The compatibility helper remains only for the documented Deno hosting gap; no new wrapper is introduced.                                  |
| A8/A9 | Changes stay in existing schema, generator, adapter, and test files under their current archetypes.                                       |
| A11   | Deploy target remains the named extension axis behind `DeployTargetPort`.                                                                 |
| A14   | Structured wrappers, semantic generator tests, asset freshness, quality scan, arch check, and scaffold consumer evidence prove the slice. |

## Goal

Record a member-by-member 13.5 API verdict, correct the AppHost default and stale upstream anchors,
pin the 13.5 deploy CLI argv contract in tests, regenerate derived assets, and leave a draft PR with
five reviewable commits and trustworthy gate evidence.

## Scope

- Add the SDK-member and deploy-command contract table to the run dir and PR timeline.
- Change `AspireConfigSchema.appHost` to `./aspire/apphost.mts` with documentation and a test.
- Confirm the baseline #1371 emitted-module tests cover service-reference injection; add no case
  unless a real gap is found.
- Re-anchor two stale comments and update only the named architecture-debt entry.
- Add focused 13.5 argv coverage to the existing deploy adapter tests; retain `--yes` only for
  Aspire destroy.
- Regenerate the embedded asset barrel and run the named local gates without an AppHost lease.

## Non-Scope

- Aspire version-pin constants, `packages/fresh`, skills/public docs, research-run artifacts,
  generator manifests, AppHost/CLI mutation, and any host start.
- `addDenoApp` adoption (S12), port/health/resource-command emission changes (S5/S6/S8), and any
  emission-shape change beyond the already-landed #1371 coverage and config default.
- Ready-for-review transition, IMPL-EVAL, merge, release, or self-certification.

## Hidden Scope

- `gen:assets-barrel` updates `packages/cli/src/kernel/assets/embedded.generated.ts` from the
  changed compatibility template.
- Scoped wrappers exclude some config files, so touched-file raw `deno fmt --check` and `deno lint`
  supplement—but do not replace—the wrapper verdicts.

## Locked Decisions

| ID   | Decision                                                                                       | Rationale                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| S4-1 | All SDK member rows are `unchanged`; no member-driven emission edit.                           | Research §4 plus official 13.5.1 pages; S2 confirms the health-check options-object projection. |
| S4-2 | Keep `addExecutable('deno', …)` and `_aspire-compat`; re-anchor to 13.6 and S12.               | D-4; first-party Deno hosting is not in 13.5 even though CommunityToolkit projects APIs.        |
| S4-3 | Do not modify #1371 emission/tests unless the baseline test lacks the named env-key assertion. | #1728 is in base and closes #1371 with positive and negative emitted-module coverage.           |
| S4-4 | Add/use `--yes` only for `aspire destroy`; never for publish/deploy.                           | Verbatim S2 V12 help receipts.                                                                  |
| S4-5 | PLAN-EVAL is N/A.                                                                              | This is a bounded implementation of already-ratified D-4/D-15 with no open decision.            |

## Open-Decision Sweep

| Decision                       | Status        | Notes                                                  |
| ------------------------------ | ------------- | ------------------------------------------------------ |
| SDK emission shape             | resolved      | All members remain; no change.                         |
| CommunityToolkit Deno adoption | safe to defer | Owned by S12 (0.0.8).                                  |
| Deploy confirmation flag       | resolved      | `destroy` only.                                        |
| #1371 additional coverage      | resolved      | Baseline test already covers the required service key. |

## Risk Register

| Risk                                                                                              | Mitigation                                                                                                             |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Reference renderer shows positional parameters while generated projection accepts option objects. | Record both rendered signature and S2 restored-module evidence; do not rewrite valid emission to match flattened docs. |
| Asset generation creates unrelated churn.                                                         | Run the canonical generator, inspect the diff, and commit only expected embedded asset changes.                        |
| Existing deploy behavior is correct but unpinned.                                                 | Add semantic argv assertions, including presence/absence of `--yes`.                                                   |
| No runtime lease.                                                                                 | Run generator/static/scaffold.plugins gates only; cite S2 receipts and leave runtime verdict to PR CI.                 |

## Anti-Patterns to Resolve or Avoid

| AP          | Status | Plan                                                                                  |
| ----------- | ------ | ------------------------------------------------------------------------------------- |
| AP-2        | risk   | Do not replace upstream SDK members with local wrappers.                              |
| AP-11/AP-25 | risk   | Keep process calls in existing adapters and filesystem effects out of generator code. |
| AP-18       | risk   | Assert semantic generated fragments/argv, not giant snapshots.                        |
| AP-23/AP-24 | risk   | Do not change composition or registry topology.                                       |

## Fitness Gates

| Gate                                                           | Required       | Expected evidence                                                                                            |
| -------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------ |
| F-1/F-3/F-5/F-6/F-7/F-8/F-9/F-10/F-11/F-12/F-15/F-16/F-17/F-18 | yes            | scoped wrappers, focused JSR/doc audit, `quality:scan`, `arch:check`                                         |
| F-CLI-1…F-CLI-31                                               | yes            | `arch:check` plus manual no-topology-change review; record `PENDING_SCRIPT` where no dedicated script exists |
| Consumer generation                                            | yes            | generator unit tests, asset freshness, `scaffold.plugins`                                                    |
| Runtime AppHost                                                | deferred to CI | CI `scaffold.runtime` after ready plus cited S2 receipts; no local lease                                     |

## Arch-Debt Implications

| Entry                                                                               | Action | Notes                                                                                                     |
| ----------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| `packages/cli — CommunityToolkit Deno/SQLite TypeScript AppHost re-enable deferred` | update | Replace disproven projection evidence; close only after S12 restore/runtime proof and workaround removal. |

## Validation Plan

| Order | Gate          | Command or check                                               | Expected result                         |
| ----- | ------------- | -------------------------------------------------------------- | --------------------------------------- |
| 1     | slice tests   | focused config, generator, and deploy adapter tests            | pass                                    |
| 2     | assets        | `deno task gen:assets-barrel`; `deno task check:assets-barrel` | expected generated diff; freshness pass |
| 3     | static        | scoped check/test/lint/fmt wrappers for owned roots            | pass                                    |
| 4     | touched files | raw `deno fmt --check` / `deno lint` on touched TypeScript     | pass                                    |
| 5     | doctrine      | `deno task quality:scan`; `deno task arch:check`               | pass                                    |
| 6     | JSR           | focused CLI/config JSR/doc audit                               | no introduced issue                     |
| 7     | consumer      | `deno task e2e:cli run scaffold.plugins --format pretty`       | pass without AppHost runtime            |

## Dependencies

- Baseline #1728 (`8b1e42f72`), final upstream rebase `13878a80a`, and S2 branch receipts.
- S1 pin bump is separate and intentionally absent from this branch.

## Drift Watch

- Any SDK row that is changed/removed, any need for emission-shape changes, any unexpected asset
  churn, or any request to start/mutate an AppHost is logged and rescaled before proceeding.
