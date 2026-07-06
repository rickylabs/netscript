# Context Pack — issue #346 Deploy S10

## Current State

- Branch: `feat/346-deploy-s10`
- Worktree: `/home/codex/repos/netscript-346-deploy`
- Run slice dir: `.llm/runs/beta5-impl--supervisor/slices/346-deploy/`
- Issue: #346 `[Deploy-S10] Aspire Kubernetes + Azure + Docker-image providers`

## Implemented

- Added `AspireCloudDeployTarget` for `kubernetes`, `azure-aca`, `azure-app-service`, `azure-aks`, and `cloud-run`.
- Registered S10 keys in `DeployTargetRegistry` and exposed them through `netscript deploy <target>`.
- Added config schema/type support for S10 target keys.
- Updated CLI README and deploy how-to with Kubernetes `publishAsKubernetesService`, Helm/kubectl apply, Azure/cloud prerequisites, and operator-owned auth/RBAC.
- Added targeted adapter/router/registry/config tests.

## Important Drift

- Live issue body says stable Phase 3b, while prompt says beta.5.
- No slice-local plan-eval artifact existed in checkout before implementation.
- ACA/App Service/Cloud Run are generic Aspire environment adapters pending provider-specific AppHost integration selection.

## Validation Run

- Targeted tests: PASS, `40 passed | 0 failed`.
- Scoped wrappers on touched TypeScript: PASS for check, lint, and fmt.
- Full `deno task check`: PASS, zero occurrences.
- Full `deno task test`: PASS, `1530 passed (482 steps)`, `0 failed`, `12 ignored`.
- `deno task doc:lint --root packages/cli --pretty`: PASS, zero total errors.
- `deno task doc:lint --root packages/config --pretty`: PASS, zero total errors; existing `src/merge/mod.ts` entrypoint detail remains non-fatal in wrapper output.
- `deno task publish:dry-run`: PASS, dry run completed with existing dynamic-import warnings.
- `deno.lock`: unchanged.

Do not run `deno task e2e:cli`; supervisor owns it.
