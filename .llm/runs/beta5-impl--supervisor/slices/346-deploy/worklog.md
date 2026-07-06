# Worklog: issue #346 Deploy S10

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `beta5-impl--supervisor/slices/346-deploy` |
| Branch | `feat/346-deploy-s10` |
| Archetype | `7 - Deployment Target Adapter` |
| Scope overlays | `docs` |

## Design

### Public Surface

- CLI entrypoints: `netscript deploy kubernetes <op>`, `netscript deploy azure-aca <op>`, `netscript deploy azure-app-service <op>`, `netscript deploy azure-aks <op>`, `netscript deploy cloud-run <op>`.
- Config keys: `deploy.targets.kubernetes`, `deploy.targets['azure-aca']`, `deploy.targets['azure-app-service']`, `deploy.targets['azure-aks']`, `deploy.targets['cloud-run']`.

### Domain Vocabulary

- `AspireCloudTargetKey` — first-party cloud target registry keys.
- `AspireCloudDeployTarget` — `DeployTargetPort` adapter delegating to Aspire publish/deploy/destroy.
- `AspireCloudDeployTargetSchema` / `AspireCloudDeployTarget` config type — shared target config shape for Aspire cloud environments.

### Ports

- `ProcessPort` — shells `aspire` at the adapter edge.
- `DeployTargetPort` — existing uniform target adapter contract consumed by the router.

### Constants

- Target keys: `kubernetes`, `azure-aca`, `azure-app-service`, `azure-aks`, `cloud-run`.
- Default Aspire environments: `k8s`, `aca`, `app-service`, `aks`, `cloud-run`.
- Default output dirs: `.deploy/<target>`.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | S10 Aspire cloud target adapters + docs | targeted tests, scoped wrappers, full check/test, doc lint/publish dry run | `packages/cli/src/kernel/adapters/aspire/*`, deploy registry/router tests, `packages/config`, `packages/cli/README.md`, `docs/site/how-to/deploy.md`, this slice dir |

### Deferred Scope

- Provider-specific Cloud Run/ACA/App Service config resolvers — thin adapter delegates to AppHost environments for this slice.
- Runtime `status`/`logs` for Aspire cloud targets — no generic Aspire deployed-status/logs command is present in the current target seam.
- Automatic AppHost integration installation — operator must run `aspire add ...` and edit `aspire/apphost.mts`.

### Contributor Path

To add a provider, add a target descriptor to `AspireCloudDeployTarget`, reserve the key in `KnownDeployTargetKey`, register it in `DeployTargetRegistry`, expose it in `deploy-group.ts`, then add adapter/router/config tests and docs for provider prerequisites.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-06T00:22:38Z | 1 | research | Viewed issue #346; verified branch has no upstream and no existing PR. |
| 2026-07-06T00:22:38Z | 1 | implementation | Added `AspireCloudDeployTarget`, registered S10 keys, exposed router commands, added config schemas/types/tests, and updated docs. |
| 2026-07-06T00:55:00Z | 1 | validation | Targeted tests, scoped wrappers, full check/test, doc lint, and publish dry-run completed. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Delegate Kubernetes/Azure/provider operations to Aspire CLI | Aspire CLI/docs expose publish/deploy/destroy and Kubernetes/AKS environment APIs. | `aspire --help`; `aspire docs get ...` |
| Omit status/logs for Aspire cloud targets | No generic deployed target status/log contract is present in the current adapter seam. | `aspire --help`; `DeployTargetPort` subset rule |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Prompt says beta.5, issue says stable Phase 3b. | significant | yes |
| No slice-local PLAN-EVAL artifact existed in checkout before implementation. | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Targeted tests | `rtk proxy deno test --allow-all packages/cli/src/kernel/adapters/aspire/aspire-cloud-deploy-target_test.ts packages/cli/src/kernel/domain/deploy/deploy-target-port_test.ts packages/cli/src/public/features/deploy/target/target-deploy-command_test.ts packages/config/tests/schema/deploy_schema_test.ts packages/config/tests/schema/netscript_config_test.ts` | PASS | `40 passed | 0 failed`. |
| Scoped check | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file <touched-ts> --ext ts,tsx` | PASS | 12-file implementation set plus final export-file rerun had zero occurrences. |
| Scoped lint | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --file <touched-ts> --ext ts,tsx` | PASS | 12-file implementation set plus final export-file rerun had zero occurrences. |
| Scoped fmt | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file <touched-ts> --ext ts,tsx` | PASS | 12-file implementation set plus final export-file rerun had zero findings. |
| Full check | `rtk proxy deno task check` | PASS | `2103` selected files, zero occurrences. |
| Full test | `rtk proxy deno task test` | PASS | `1530 passed (482 steps)`, `0 failed`, `12 ignored`. |
| CLI doc lint | `rtk proxy deno task doc:lint --root packages/cli --pretty` | PASS | Zero total errors/private type refs. |
| Config doc lint | `rtk proxy deno task doc:lint --root packages/config --pretty` | PASS | Summary reports zero total errors; pretty output still exposes existing `src/merge/mod.ts` entrypoint detail with no combined errors. |
| Publish dry run | `rtk proxy deno task publish:dry-run` | PASS | Dry run completed; existing dynamic-import warnings only. |
| Lock hygiene | `rtk git diff -- deno.lock` | PASS | No `deno.lock` changes. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| F-DEPLOY-1 | PASS | `aspire-cloud-deploy-target_test.ts`; `deploy-target-port_test.ts` | Adapter operations map to publish/deploy/destroy handlers. |
| F-DEPLOY-2 | PASS | `target-deploy-command_test.ts` | Router derives available verbs from adapter operations. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Live cloud deploy | N/A | not run | Requires user-owned cloud accounts/clusters/RBAC; unit tests verify argv delegation. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| CLI router/config consumers | PASS | targeted CLI/config tests | Registry, router, and schema consumers accept S10 keys. |

## Handoff Notes

- Inspect `packages/cli/src/kernel/adapters/aspire/aspire-cloud-deploy-target.ts` first.
- Verify docs honestly describe operator-owned auth/RBAC and AppHost prerequisites.
- Check whether supervisor wants issue #346 milestone/body reconciled before closing.
