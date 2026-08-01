# Worklog: same-semver canary republish

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1004-canary-republish--same-semver` |
| Branch | `fix/1004-canary-republish` |
| Archetype | N/A |
| Scope overlays | none |

## Design

### Public Surface

- `validateRepublishVersion(targetVersion, republishVersion)` — validates canonical same-train canary identity.
- `verifyCanaryRepublishTree(root, republishVersion, runner)` — resolves tag/HEAD trees and rejects nonidentity.
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

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Harness research and approved plan | PLAN-EVAL | `.llm/runs/fix-1004-canary-republish--same-semver/**` |
| 2 | Fail-closed republish contract and workflow wiring | scoped check + two requested tests | `canary.ts`, `canary_test.ts`, `release-canary.yml`, workflow test, release skill, run artifacts |

### Deferred Scope

- Live JSR retry — publication remains workflow-only/OIDC; evidence is unchanged path plus documented precedent.
- Stable gate changes — prohibited by issue scope.

### Contributor Path

Start at the `republish-version` workflow input, follow the guarded `canary` output step into the unchanged publish chain, and inspect `canary.ts` for validation/tree authorization.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | 1 | Research | Root-cause claims verified against current main. |

## Gate Results

Pending PLAN-EVAL.

