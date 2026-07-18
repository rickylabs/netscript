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
| `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts` | modified | Direct lockstep resolver with protected fallback. |
| `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb_test.ts` | modified | Full argv tests for unversioned/exact lockstep, third-party, and old-version inputs. |
| `packages/cli/src/public/features/plugins/ai/ai-plugin-command.ts` | modified | Direct published `cli.ts` execution with explicit project config. |
| `packages/cli/src/public/features/plugins/ai/ai-plugin-command_test.ts` | modified | Exact AI command-array regression. |
| `packages/cli/src/public/features/agent/init/init-agent.ts` | modified | Explicit absolute root config in generated MCP argv. |
| `packages/cli/src/public/features/agent/init/init-agent_test.ts` | modified | Complete Claude and VS Code argv regressions. |
| `packages/cli/README.md` | modified | Release-day resolver policy and updated plugin-dispatch mechanics. |
| `docs/site/orchestration-runtime/cli-scaffold.md` | modified | Scaffold/plugin 24-hour-window note. |
| `docs/site/capabilities/agent-tooling.md` | modified | Agent host explicit-config and scoped-policy note. |
| `.llm/runs/beta11-cli--orchestrator/slices/g11-818-minage/*` | modified | S1 evidence and handoff. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | PASS | Supervisor Tier-A verdict approved D1–D6. |
| Static | PASS | S3 scoped wrappers clean; full CLI package 379 tests / 410 steps. |
| Fitness | PASS | Latest `quality:scan` and `arch:check` exited 0. |
| Runtime | PASS | `scaffold.runtime`: 60 passed, 0 failed, cleanup passed. |
| Consumer | PASS | Generated config parser, plugin behavior paths, MCP stdio/package tests, and full runtime smoke passed. |
| Docs | PASS with baseline | Links and CLI doc lint pass; repository README-standard retains its pre-existing 35/36 failure. |

## Open Questions

- None blocking IMPL-EVAL. Fresh canary proof remains behind the in-turn owner publish stop-line.

## Drift and Debt

- Drift: parent orchestrator plan artifacts absent locally; prompt-supplied locked decision used.
- Debt: none created; existing CLI debt unchanged.

## Commits

- `260c5eea` — Plan/Design bootstrap.
- `af9e0181` — S1 generated-project minimum-age policy.
- `5ad34dee` — S2 lockstep plugin/AI direct execution.
- S3 commit — populated after commit; see draft PR #856 and its implementation-complete comment.
