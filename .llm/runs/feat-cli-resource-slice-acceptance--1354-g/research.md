# Research — feat-cli-resource-slice-acceptance--1354-g

## Re-baseline

- Carried-in source: `origin/feat/cli-resource-slice-plan:.llm/runs/feat-cli-resource-slice--1354/plan.md`, locked Slice G.
- Re-derived against Slice F at `8c27ffe164fc8dab8e16796e602693e6dea95c1e` on 2026-09-03, as explicitly required by the owner. This run does not rebase or compare implementation scope against `main`.
- What changed vs the carried-in version:
  - Initial scope held at seven files until full-suite discovery proved the captured-stdout fixture gap.
  - PR #1891 subsequently amended Slice G to eight files and explicitly authorized the existing suite-runner test fixture.
  - Slice F already registered `generate resource` and repointed surviving convention references.
  - `CommandGateDefinition.stdoutIncludes` already provides the captured-output assertion seam.
  - `RUNTIME_GATES` is currently module-private and can be exported from its already-owned file for the required direct membership test.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | The branch is clean at the required Slice F head. | `git rev-parse HEAD`; raw `git status --short` |
| 2 | `createScaffoldGates()` registers init, generated service clients, and service discovery before later generated-project quality gates are selected. | `packages/cli/e2e/src/application/gates/scaffold/scaffold-gates.ts`; `scaffold-capability-gates.ts` |
| 3 | The runtime suite has both `users` and `payments` generated clients before the resource gates, so the resource command must pass `--client users`. | service add/generate gates in `scaffold-gates.ts`; `service-client-runtime-probe_test.ts` |
| 4 | A core + partial resource slice has eight owned leaves and three shared outputs (`manifest`, routes, app router), so an identical rerun reports 11 skips and zero writes/conflicts. | `plan-resource-slice.ts`; `public-command-dependencies.ts`; `generate-resource-command.ts` |
| 5 | Captured stdout requirements are native gate-definition data and are enforced by `CommandGate`. | `gate-definition.ts`; `command-gate.ts` |
| 6 | Generated `AGENTS.md` and `WEB-LAYER.md` share pure template builders and a declared referenced-path surface. | `agent-conventions.ts` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: no `mod.ts`, `deno.json`, export-map, dependency, or public type changes are in scope.
- Slow-type / surface risks: none introduced. The plan still requires the existing CLI JSR audit and publish/asset gates as regression evidence.

## Open questions

- None. Resource/client/procedure identities, composition order, rerun output, scope, and gates are locked by the upstream plan.
