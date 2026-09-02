# Plan: SDK contribution conflict diagnostics

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `feat-sdk-contribution-conflict-diagnostics--1349` |
| Branch         | `feat/sdk-contribution-conflict-diagnostics`       |
| Phase          | `plan`                                             |
| Target         | `packages/sdk`                                     |
| Archetype      | `2 — Integration`                                  |
| Scope overlays | `none`                                             |

## Archetype

`packages/sdk` is doctrine-classified as Archetype 2. This slice changes its published client
diagnostic contract and the private validation/transport adapter boundary, without adding another
port or adapter.

## Current Doctrine Verdict

`Keep` — preserve discovery/client/cache adapter boundaries.

## Axioms in Play

| Axiom | Why it matters                                                                                 |
| ----- | ---------------------------------------------------------------------------------------------- |
| A1    | The additive public diagnostic type is designed before its construction paths.                 |
| A2    | Existing `contributionId` semantics remain stable; the new role is explicit.                   |
| A11   | Owner versus claimant is the named conflict axis.                                              |
| A14   | Exact structured diagnostics, publication checks, and redaction tests are acceptance evidence. |

## Goal

Close issue #1349 acceptance row 7 by deterministically identifying the relevant descriptor for all
six measured construction cases and both parties for header/context ownership conflicts.

## Scope

- Add optional `conflictingContributionId` to the public diagnostic/error/JSON shape.
- Populate valid descriptor ids for version, closed-shape dependency/order, tuple-limit, and
  Desktop-unsupported failures.
- Populate claimant and earlier owner ids for duplicate id, header ownership, and context ownership.
- Add exact structured and `toJSON()` assertions for every required case.
- Commit the requested harness artifacts and run the complete owner-specified gate set.

## Non-Scope

- No changes to SHIPPED acceptance rows, public link/transport ports, contribution powers, budgets,
  reserved names, tracing, locale/auth contributions, query inference, retry/dedupe, or docs owned
  by PR #1922.
- No Aspire, Docker, browser, or `e2e:cli` runs.

## Hidden Scope

- Because a public type moves, run the carrier cascade after the implementation commit.
- Compare `deno doc --lint` against an isolated `origin/main` worktree and report only new
  diagnostics.
- Preserve and hash `deno.lock` before and after gates.

## Locked Decisions

| ID | Decision                                                                                                             | Rationale                                                                                                |
| -- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| D1 | Add optional `conflictingContributionId`.                                                                            | It is additive, role-specific, and preserves `contributionId` as the current claimant/offender.          |
| D2 | In ownership conflicts, `contributionId` is the later claimant and `conflictingContributionId` is the earlier owner. | This matches current behavior and deterministic tuple order.                                             |
| D3 | For duplicate ids, both fields carry the shared id.                                                                  | Both descriptors are named by the only stable identifier they expose; no synthetic identity is invented. |
| D4 | Recover only syntactically valid public ids for pre-validation diagnostics.                                          | Invalid/missing ids have no trustworthy identity and remain unnamed.                                     |
| D5 | Tuple overflow reports descriptor 17; Desktop reports the first supplied valid descriptor.                           | These are the deterministic descriptors that trigger each rejection.                                     |

## Open-Decision Sweep

| Decision                                           | Status        | Notes                                                            |
| -------------------------------------------------- | ------------- | ---------------------------------------------------------------- |
| Nested conflict object versus optional field       | resolved now  | D1 avoids changing existing fields and minimizes surface growth. |
| Whether malformed descriptors receive invented ids | safe to defer | They do not; only contract-valid ids are exposed.                |

## Risk Register

| Risk                                                     | Mitigation                                                                                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Owner/claimant roles are swapped.                        | Exact tests assert both named fields and their orientation for header and context conflicts.                                            |
| Early id extraction changes rejection precedence.        | Extraction is non-throwing; existing code/phase remain unchanged.                                                                       |
| Diagnostics leak values.                                 | Only validated ids and declared header names enter the shape; existing redaction suite remains green.                                   |
| Sibling PR collision.                                    | Touch only diagnostic construction, error contract, validation tests, and run artifacts; do not edit sibling-owned docs/trace surfaces. |
| Validation module crosses the 500-line review threshold. | Keep reusable diagnostic-id parsing in a narrowly named internal policy module consumed by validation and Desktop construction.         |

## Anti-Patterns to Resolve or Avoid

| AP    | Status | Plan                                                                 |
| ----- | ------ | -------------------------------------------------------------------- |
| AP-1  | risk   | Keep changes focused; do not broaden the existing validation module. |
| AP-5  | avoid  | No new catch-and-rethrow or opaque error path.                       |
| AP-15 | avoid  | Do not expose credentials, context/header values, or causes.         |
| AP-20 | avoid  | Preserve the validated public boundary instead of unchecked casts.   |

## Fitness Gates

| Gate                           | Required | Expected evidence                                            |
| ------------------------------ | -------- | ------------------------------------------------------------ |
| F-5/F-7                        | yes      | `deno doc --lint` A/B; docs example gate                     |
| F-6                            | yes      | SDK `deno publish --dry-run`                                 |
| F-10                           | yes      | Structured SDK test wrapper with exact counts                |
| F-1..F-19 applicable composite | yes      | `deno task quality:gate` and explicit `deno task arch:check` |
| F-19                           | yes      | Scoped check/lint/fmt wrappers                               |

## Arch-Debt Implications

| Entry/path                       | Action | Notes                                             |
| -------------------------------- | ------ | ------------------------------------------------- |
| `.llm/harness/debt/arch-debt.md` | none   | No new or deepened doctrine violation is planned. |

## Validation Plan

| Order | Gate            | Command or check                                       | Expected result                    |
| ----- | --------------- | ------------------------------------------------------ | ---------------------------------- |
| 1     | focused tests   | structured test wrapper over SDK validation test       | exact diagnostics pass             |
| 2     | static          | owner-specified scoped check/lint/fmt wrappers         | exit 0                             |
| 3     | package tests   | owner-specified SDK test wrapper                       | exit 0 and exact counts            |
| 4     | docs            | `deno doc --lint` A/B; `deno task docs:jsdoc-examples` | zero new diagnostics; ceiling ≤116 |
| 5     | publish         | `deno publish --dry-run` in `packages/sdk`             | exit 0, intended file list         |
| 6     | carrier cascade | three owner-specified generation tasks after commit    | exit 0 and reviewed diff           |
| 7     | fitness         | `deno task quality:gate`; `deno task arch:check`       | exit 0                             |
| 8     | lock            | `sha256sum deno.lock`                                  | unchanged from baseline            |

## Risks

- Public-surface propagation may update generated carrier assets; inspect and commit only necessary
  outputs.

## Dependencies

- Audit evidence on `chore/sdk-client-1349-acceptance-audit`.
- Separate-session IMPL-EVAL on the canonical opposite-family route.

## Drift Watch

- Any need to touch sibling-owned trace/locale/docs files, contribution fields/reservations/budget,
  or unrelated SDK issue scope requires a rescope rather than an opportunistic edit.
