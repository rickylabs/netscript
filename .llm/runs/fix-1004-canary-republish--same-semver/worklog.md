# Worklog: same-semver canary republish

## Run Metadata

| Field          | Value                                    |
| -------------- | ---------------------------------------- |
| Run ID         | `fix-1004-canary-republish--same-semver` |
| Branch         | `fix/1004-canary-republish`              |
| Archetype      | N/A                                      |
| Scope overlays | none                                     |

## Design

### Public Surface

- `validateRepublishVersion(targetVersion, republishVersion)` — validates canonical same-train
  canary identity.
- `verifyCanaryRepublishTree(root, republishVersion, runner)` — resolves tag/HEAD trees and rejects
  nonidentity.
- Workflow dispatch input `republish-version` — selects retry mode.

### Domain Vocabulary

- Target version — stable release core such as `0.0.2`.
- Republish version — immutable prerelease such as `0.0.2-canary.3`.
- Tagged tree / checked-out tree — git tree object SHAs used for byte-identity authorization.

### Ports

- `ReleaseCommandRunner` — existing injectable command seam for deterministic git tests.

### Constants

- `CANARY_PRERELEASE_LABEL` — existing canonical `canary` label.
- Workflow conditions derive solely from whether `inputs.republish-version` is empty.

### Commit Slices

| # | Slice                                              | Gate                               | Files                                                                                            |
| - | -------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1 | Harness research and approved plan                 | PLAN-EVAL                          | `.llm/runs/fix-1004-canary-republish--same-semver/**`                                            |
| 2 | Fail-closed republish contract and workflow wiring | scoped check + two requested tests | `canary.ts`, `canary_test.ts`, `release-canary.yml`, workflow test, release skill, run artifacts |

### Deferred Scope

- Live JSR retry — publication remains workflow-only/OIDC; evidence is unchanged path plus
  documented precedent.
- Stable gate changes — prohibited by issue scope.

### Contributor Path

Start at the `republish-version` workflow input, follow the guarded `canary` output step into the
unchanged publish chain, and inspect `canary.ts` for validation/tree authorization.

## Progress Log

| Time       | Slice | Step      | Notes                                                                                                                                                   |
| ---------- | ----- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-01 | 1     | Research  | Root-cause claims verified against current main.                                                                                                        |
| 2026-08-01 | 1     | PLAN-EVAL | Owner-waived Opus supervisor returned FAIL with one required working-tree-cleanliness correction; no second cycle required.                             |
| 2026-08-01 | 2     | Implement | Added canonical input validation, clean working-tree plus tag/HEAD tree guard, conditional ref lifecycle, stable outputs, tests, and operator doctrine. |
| 2026-08-01 | 2     | Reconcile | PR #1035 remains the resolving draft with `Closes #1004`, milestone 0.0.3, and the required taxonomy; no new review comments altered scope.             |

## Decisions

| Decision                                    | Reason                                                                                                     | Source                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Require clean status before tree comparison | `deno publish --allow-dirty` uploads working-tree bytes, so committed-tree equality alone is insufficient. | PLAN-EVAL finding 1                  |
| Preserve the existing publisher             | Root `deno publish` already supplies the required skip-existing/fill-missing behavior.                     | research finding 2; release doctrine |

## Drift

| Drift                                                                             | Severity    | Logged in drift.md |
| --------------------------------------------------------------------------------- | ----------- | ------------------ |
| Owner-waived Opus evaluator superseded missing local OpenRouter route             | significant | yes                |
| Working-tree cleanliness added beyond the issue brief's committed-tree comparison | significant | yes                |

## Gate Results

### Static Gates

| Gate                    | Command or check                                                                | Result  | Notes                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Format                  | `deno fmt` on the eight changed TS/YAML/Markdown files, then `deno fmt --check` | PASS    | `Checked 8 files`                                                                                                                                                             |
| Scoped lint             | `run-deno-lint.ts` with the three changed release TS files                      | PASS    | 3 files; 0 occurrences                                                                                                                                                        |
| Release type-check      | `deno run -A .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts`   | PASS    | 32 files; 1 batch; 0 diagnostics                                                                                                                                              |
| Requested literal tests | `deno test canary_test.ts release-canary-workflow_test.ts`                      | NOT_RUN | Command executed, but Deno denied workflow fixture reads: 11 unit tests passed and 3 shape tests stopped on `NotCapable`; the issue command omitted required read permission. |
| Unit + workflow shape   | `deno test --allow-read canary_test.ts release-canary-workflow_test.ts`         | PASS    | 14 passed; 0 failed                                                                                                                                                           |
| Diff hygiene            | `git diff --check`                                                              | PASS    | no errors                                                                                                                                                                     |

### Fitness Gates

| Gate                             | Result | Evidence                                                  | Notes                                                                            |
| -------------------------------- | ------ | --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Fail-closed same-semver identity | PASS   | clean-match, dirty-rejection, and SHA-mismatch unit tests | Both working and committed trees are covered.                                    |
| Unchanged publisher/order        | PASS   | workflow-shape ordered assertion                          | readiness → provisioning → dry-run → preflight → real publish remains identical. |

### Runtime Gates

| Gate             | Result | Evidence                   | Notes                                                                                      |
| ---------------- | ------ | -------------------------- | ------------------------------------------------------------------------------------------ |
| Live JSR publish | N/A    | release doctrine precedent | Publishing is OIDC workflow-only and was not dispatched from this implementation worktree. |
| Scaffold runtime | N/A    | issue instruction          | No scaffold surface changed.                                                               |

### Consumer Gates

| Consumer                        | Result | Evidence             | Notes                                                                                                     |
| ------------------------------- | ------ | -------------------- | --------------------------------------------------------------------------------------------------------- |
| `release-canary.yml` dispatcher | PASS   | workflow-shape tests | Republish skips cut and cleanup, supplies stable `version`/`tag`, and reaches unchanged downstream steps. |

## Handoff Notes

- Inspect `verifyCanaryRepublishTree` first, especially the clean-status check before tree
  resolution.
- Confirm republish mode never creates or deletes refs and that `steps.canary.outputs` remains the
  sole downstream context.
- Acceptance gate 2 is evidenced by unchanged workflow order plus the release skill's beta.10/Deno
  precedent; no live publish is claimed.
