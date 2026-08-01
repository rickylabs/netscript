# Plan: same-semver canary republish

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1004-canary-republish--same-semver` |
| Branch | `fix/1004-canary-republish` |
| Phase | `plan` |
| Target | release infrastructure/tooling |
| Archetype | N/A — no package/plugin surface changes |
| Scope overlays | none |

## Goal

Allow a partially published canary to complete at the identical `canary.N`, while failing closed unless the dispatcher checks out content tree-identical to the existing canary tag.

## Scope

- Add and validate `republish-version` in `release-canary.yml`.
- Extend the canary release module with injectable validation and git tree-identity checks.
- Preserve the existing readiness/provision/dry-run/preflight/publish/E2E/status chain.
- Document the operator path next to same-semver recovery doctrine.

## Non-Scope

- No relaxation of `release:verify-canary-pair`.
- No changes to `run-publish.ts` or `publish-workspace.ts`.
- No tag checkout, tag move, new canary bump, branch creation, or cleanup deletion in republish mode.
- No scaffold E2E.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | The workflow input is `republish-version`; a helper validates exact membership in `target-version` using stable-semver and canonical canary syntax. | Prevents cross-train and noncanonical retries. |
| D2 | A tested helper resolves `v$V^{tree}` and `HEAD^{tree}` through an injectable `ReleaseCommandRunner`, then rejects differing SHAs with both in the error. | Fail-closed, byte-oriented, unit-testable, and does not make the guard vacuous by checking out the tag. |
| D3 | The existing `canary` step remains the output owner; republish mode sets `version` and `tag`, leaves `branch` empty, and skips cut and cleanup paths. | Downstream publish/E2E/status steps remain unchanged. |
| D4 | Republish concurrency and run name include the effective republish identity. | Avoids ambiguity and keeps same-version retries serialized coherently. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| New task vs direct module invocation | safe to defer; resolved to direct module invocation | A new task adds no useful contract for one workflow guard. |
| Priority label | safe to defer; resolved to `priority:p1` | Release-blocking recovery defect, not current outage. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Republish accidentally mutates refs | Workflow-shape tests assert cut and cleanup conditions, empty branch output, and unchanged publish sequence. |
| Input targets another release train | Unit-test exact canonical relation and invoke validation before publish. |
| Same commit but dirty checkout | Git tree object comparison intentionally checks committed checked-out content; Actions checkout is clean and later steps have not mutated source before guard. |
| Status written to wrong SHA | Preserve context capture from checkout HEAD and assert green status remains after awaited E2E. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Format | scoped formatter on changed TS files | PASS |
| 2 | Lint | scoped lint wrapper on changed TS files | PASS |
| 3 | Check | `deno run -A .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts` | PASS |
| 4 | Unit/workflow shape | `deno test .llm/tools/release/canary_test.ts .llm/tools/release/release-canary-workflow_test.ts` | PASS |
| 5 | Manual release review | diff confirms identical publish steps and fail-closed gate | PASS |

## Drift Watch

- Any evidence that root `deno publish` fails rather than skips an existing member changes the diagnosis and requires rescope.
- Any requirement to modify stable pair verification is out of scope and requires owner direction.

