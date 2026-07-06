# Worklog

## Design

### Public Surface

- Generated project files:
  - `.github/workflows/deploy-compose-ghcr.yml`
  - `.github/workflows/deploy-deno-deploy.yml`
  - `.github/workflows/deploy-bare-metal.yml`
- Existing CLI deploy target adapter behavior:
  - `AspireComposeDeployTarget` shells `aspire publish` / `aspire deploy`.
- No new package exports or command names are planned.

### Domain Vocabulary

- **Deploy workflow template:** checked-in `.template` asset emitted into generated projects.
- **Promotion environment:** `development`, `staging`, `production`, mapped to Aspire `--environment` and GitHub Environments.
- **CI-safe Aspire deploy:** deploy invocation that uses `--clear-cache` and does not persist `~/.aspire/deployments`.
- **Shipped targets:** `compose`, `deno-deploy`, bare-metal compile/OS-service.

### Ports

- Existing `ProcessPort` remains the Aspire adapter side-effect seam.
- Existing scaffold `context.scaffolder` remains the generated-file write seam.
- No new external port is planned.

### Constants

- Workflow asset keys will be added to `TEMPLATE_KEYS`.
- Workflow target filenames:
  - `deploy-compose-ghcr.yml`
  - `deploy-deno-deploy.yml`
  - `deploy-bare-metal.yml`
- Aspire promotion environments:
  - `development`
  - `staging`
  - `production`

### Commit Slices

1. S11-A: register and emit generated workflow templates; prove with focused scaffold/template tests.
2. S11-B: harden Aspire adapter CI cache behavior; prove `aspire deploy` argv includes `--clear-cache`/environment controls where needed.
3. S11-C: docs and generated README promotion guidance; prove with generator tests.
4. S11-D: final validation, commit trail, and slice completion.

### Deferred Scope

- New CLI generation command.
- Encrypted persisted Aspire cache.
- Live deploy validation.
- Sibling deploy slices.

### Contributor Path

To add a future workflow template, add a `.template` file under `packages/cli/src/kernel/assets/workspace/github/workflows/`, register it in `TEMPLATE_KEYS`, expose it through `loadRootScaffoldTemplateAssets()`, write it from `scaffoldRoot()`, regenerate `embedded.generated.ts`, and add a focused scaffold test asserting the emitted path and key lines.

## Evidence

| Time | Action | Result |
| --- | --- | --- |
| 2026-07-06 | Loaded required skills and harness docs. | Complete. |
| 2026-07-06 | Fetched issue #347 with `gh issue view 347 --repo rickylabs/netscript --json title,body`. | Scope confirmed. |
| 2026-07-06 | Checked branch/status. | On `feat/347-deploy-s11`, clean worktree before planning. |
| 2026-07-06 | Ran `aspire deploy --help`, `aspire publish --help`, and `aspire docs get deployment-state-caching`. | Confirmed `--clear-cache` and plaintext cache docs. |
| 2026-07-06 | Separate PLAN-EVAL returned `FAIL_PLAN`. | Gate set omitted full A7/A6 evidence and scaffold runtime merge-readiness gate. |
| 2026-07-06 | Updated plan gate set. | Added universal fitness, F-CLI, F-DEPLOY, consumer validation, and supervisor-owned `scaffold.runtime` merge-readiness gate while preserving the implementation-slice instruction not to run `e2e:cli`. |
| 2026-07-06 | Separate PLAN-EVAL second pass returned `PASS`. | `plan-eval.md` updated from evaluator-provided PASS content. |

## Reconcile Notes

- Pre-implementation reconcile: no product code changed; issue #347 scope is unblocked by closed #342/#343 per issue body.
