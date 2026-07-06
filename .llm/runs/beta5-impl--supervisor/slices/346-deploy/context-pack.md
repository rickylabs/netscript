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
- Slice 2 fixed PR #491 adversarial-review caveats: Kubernetes/Azure no longer pass platform names via `aspire --environment`; AppHost targets validate source markers and use `--apphost`; router plumbs target config; Cloud Run uses `registry`/`imageName` with Docker build/push and `gcloud run deploy`.

## Important Drift

- Live issue body says stable Phase 3b, while prompt says beta.5.
- No slice-local plan-eval artifact existed in checkout before implementation.
- ACA/App Service are marker-validated AppHost adapters pending provider-specific scaffolding.
- Cloud Run is a concrete Docker-image provider adapter; live cloud deploy remains operator-owned.

## Validation Run

- Targeted tests: PASS, `40 passed | 0 failed`.
- Scoped wrappers on touched TypeScript: PASS for check, lint, and fmt.
- Full `deno task check`: PASS, zero occurrences.
- Full `deno task test`: PASS, `1530 passed (482 steps)`, `0 failed`, `12 ignored`.
- `deno task doc:lint --root packages/cli --pretty`: PASS, zero total errors.
- `deno task doc:lint --root packages/config --pretty`: PASS, zero total errors; existing `src/merge/mod.ts` entrypoint detail remains non-fatal in wrapper output.
- `deno task publish:dry-run`: PASS, dry run completed with existing dynamic-import warnings.
- `deno.lock`: unchanged.
- Slice 2 targeted tests: PASS, `46 passed | 0 failed`.
- Slice 2 scoped wrappers on touched TypeScript: PASS for check, lint, and fmt.
- Slice 2 full `deno task check`: PASS, zero occurrences.
- Slice 2 full `deno task test`: PASS, `1536 passed (482 steps)`, `0 failed`, `12 ignored`.
- Slice 2 CLI/config doc-lint: PASS, zero total errors.
- Slice 2 `deno task publish:dry-run`: PASS, existing dynamic-import warnings only.

Do not run `deno task e2e:cli`; supervisor owns it.
