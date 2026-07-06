# Plan: issue #346 Deploy S10

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `beta5-impl--supervisor/slices/346-deploy` |
| Branch | `feat/346-deploy-s10` |
| Phase | `impl` |
| Target | `packages/cli`, `packages/config`, deploy docs |
| Archetype | `7 - Deployment Target Adapter` |
| Scope overlays | `docs` |

## Archetype

Archetype 7 applies because the deploy feature has a multi-target adapter seam plus a thin CLI router. The core uses a target registry and adapters; the command surface only routes verbs to registry-resolved adapters.

## Current Doctrine Verdict

`@netscript/cli` remains `Restructure` in doctrine file 10; this slice must not deepen the existing CLI debt. `@netscript/config` remains `Refactor`; this slice adds target schemas without splitting existing files.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A1 | Target keys/config contracts come before behavior. |
| A7 | Aspire owns publish/deploy; NetScript delegates instead of reimplementing manifests. |
| A9 | Archetype 7 governs the adapter + router shape. |
| A11 | The extension axis is deploy target key. |
| A13 | Unsupported rollback/secrets are omitted rather than no-op. |

## Goal

Implement the S10 deploy target slice: Kubernetes, Azure ACA/App Service/AKS, and one Docker-image provider target on the existing Aspire/S7 lane, with docs for auth/RBAC prerequisites and apply flows.

## Scope

- Add Aspire cloud target adapter(s) for `kubernetes`, `azure-aca`, `azure-app-service`, `azure-aks`, and `cloud-run`.
- Register the target keys in `DeployTargetRegistry` and expose them through the existing `deploy <target>` router.
- Add config schema/type support for the S10 target keys.
- Document Kubernetes `publishAsKubernetesService`, Helm/kubectl apply, Azure/cloud prerequisites, and operator-owned auth/RBAC.
- Add unit tests for adapter argv, registry keys, router verbs, and config parsing.

## Non-Scope

- Do not generate Helm/Bicep/Kubernetes/provider manifests inside NetScript.
- Do not mutate generated AppHost templates or install Aspire integrations automatically.
- Do not run `deno task e2e:cli`; supervisor owns merge-readiness E2E.

## Hidden Scope

- Existing docs say Docker/Compose/Kubernetes are manual/config-only; update them to avoid contradicting the new router.
- Config tests that previously dropped unknown target keys must retain S10 keys.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | S10 cloud targets are Aspire environment adapters. | Aspire CLI/docs own publish/deploy; avoids manifest reinvention. |
| D2 | `cloud-run` is the required Docker-image provider adapter for this slice. | The issue acceptance needs at least one Docker-image provider; Cloud Run is named in the issue. |
| D3 | Support `plan`/`emit`/`up`/`down`; omit `status`/`logs`/`rollback`/`secrets`. | Aspire provides publish/deploy/destroy generically; target-specific live status/logs/rollback/secrets need provider contracts not present in the current seam. |
| D4 | Default environment names are `k8s`, `aca`, `app-service`, `aks`, `cloud-run`. | They are explicit, stable keys callers can override later through config resolution. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Milestone conflict (beta.5 prompt vs stable issue body) | safe to defer | Recorded in `notes.md`; implementation scope still follows issue acceptance. |
| Provider-specific Cloud Run/ACA/App Service config | safe to defer | Generic Aspire environment delegation is enough for thin adapter acceptance. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| AppHost lacks the named environment | Adapter delegates to Aspire and surfaces stderr; docs state integration prerequisites. |
| Provider auth/RBAC missing | Docs state auth/RBAC are user-owned prerequisites. |
| CLI router grows target logic | Reuse existing target router; target behavior stays in adapters. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-2 | risk | Delegate to Aspire; do not wrap manifest generation with local YAML authorship. |
| AP-21/AP-23 | risk | Add targets through registry/router, not inline Cliffy bodies per target. |
| AP-24 | avoided | Use `DeployTargetRegistry`, not switch-over-target in command surface. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-DEPLOY-1 | yes | registry/port tests prove handler for each advertised op |
| F-DEPLOY-2 | yes | router tests prove verbs derive from adapter operations |
| Static package gates | yes | scoped wrapper check/lint/fmt on touched roots |
| Package tests | yes | targeted CLI/config tests; full `deno task check` + `deno task test` |
| Public surface gates | yes | `deno task doc:lint` for `packages/cli` and `packages/config`; `deno task publish:dry-run` |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| deployment / Archetype-7 future-wave | none | This implements the adapter seam inside existing CLI, without adding a new deploy package. |
| `packages/cli` restructure debt | none | New files follow current feature/adapter layout and do not deepen known monolith debt. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Targeted tests | `deno test --allow-all packages/cli/src/kernel/adapters/aspire/aspire-cloud-deploy-target_test.ts packages/cli/src/kernel/domain/deploy/deploy-target-port_test.ts packages/cli/src/public/features/deploy/target/target-deploy-command_test.ts packages/config/tests/schema/deploy_schema_test.ts packages/config/tests/schema/netscript_config_test.ts` | pass |
| 2 | Scoped check/lint/fmt | `.llm/tools/run-deno-check.ts`, `.llm/tools/run-deno-lint.ts`, `.llm/tools/run-deno-fmt.ts` on touched package/doc roots | pass |
| 3 | Full gates | `deno task check`; `deno task test` | pass |
| 4 | Public surface | `deno task doc:lint --root packages/cli --pretty`; `deno task doc:lint --root packages/config --pretty`; `deno task publish:dry-run` | pass |

## Dependencies

- S7 Docker/Compose/Aspire target lane already present in checkout.
- Aspire CLI and AppHost environment integrations are external prerequisites.

## Drift Watch

- If Aspire lacks target-specific ACA/App Service docs, keep the adapter generic and record the limitation.
- If config resolution is required by tests, add it as a separate small slice rather than embedding config logic in the router.
