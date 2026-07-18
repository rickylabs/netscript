# Context Pack: issue #818 minimum-dependency-age lockstep

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta11-cli--orchestrator/slices/g11-818-minage` |
| Branch | `fix/818-min-dep-age-lockstep` |
| Current phase | `plan-eval` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Current State

Research and Design are complete against `origin/main@56cf84b5`. The real Deno 2.9 key is
`minimumDependencyAge`; the locked plan keeps `P1D` for third parties, exempts exact-version
NetScript release-train constraints in generated JSR workspaces, and replaces only lockstep
first-party `deno x` paths with one explicit `deno run` resolver. No product implementation exists.

## Completed

- Read required harness, CLI, Deno-toolchain, PR, tooling, doctrine, JSR-audit, and rtk guidance.
- Read live issue #818, PR #817, and #813/#817 committed research.
- Verified Deno 2.9.3 help, config schema, official docs, workspace policy boundary, and local parser.
- Inventoried scaffold config, plugin dispatch, AI dispatch, and agent-init MCP builders/tests.
- Selected Archetype 6 + docs overlay and wrote the Plan-Gate artifacts.

## In Progress

- Group Plan-Gate / separate PLAN-EVAL. This implementation agent must stop here.

## Next Steps

1. Supervisor dispatches the separate open-model PLAN-EVAL; do not self-evaluate.
2. On `PASS`, implement S1 only, run its named gates, commit/push/comment, then pause for Tier-A
   review.
3. Continue S2/S3 only after each preceding Tier-A review.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| `(a)+docs` | Owner G11 brief | Locked run direction. |
| `minimumDependencyAge` object with exact exclusions | Deno 2.9 schema/docs/parser | No blanket zero. |
| Direct `deno run` for release-matched first-party only | PR #817 | Third-party and old versions keep `x`. |
| Explicit root config in MCP argv | Research/acceptance | Independent of host CWD. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `packages/cli/src/kernel/constants/scaffold/scaffold-workspace-packages.ts` | modified | Finite scaffold, engine, and connector release-train inventory. |
| `packages/cli/src/kernel/templates/workspace/deno-json.ts` | modified | JSR-only scoped `minimumDependencyAge` policy. |
| `packages/cli/src/kernel/templates/workspace/generators_test.ts` | modified | Exact exclusions, uniqueness, third-party scope, and local-mode regressions. |
| `.llm/runs/beta11-cli--orchestrator/slices/g11-818-minage/*` | modified | S1 evidence and handoff. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | PASS | Supervisor Tier-A verdict approved D1–D6. |
| Static | PASS (S1) | Scoped check/lint/fmt wrappers: zero findings. |
| Fitness | PASS (S1) | `quality:scan` and `arch:check` exited 0. |
| Runtime | PASS (S1) | Full workspace-template tests: 15/15; generated config parser: `config-ok`. |
| Consumer | DEFERRED | Full scaffold runtime remains the S3 merge-readiness gate. |

## Open Questions

- None blocking the S1 Tier-A review. Fresh canary proof remains behind the in-turn owner publish
  stop-line.

## Drift and Debt

- Drift: parent orchestrator plan artifacts absent locally; prompt-supplied locked decision used.
- Debt: none created; existing CLI debt unchanged.

## Commits

- `260c5eea` — Plan/Design bootstrap.
- S1 commit — populated after commit; see draft PR #856 and its S1 evidence comment.
