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
| 2026-07-06 | Implemented workflow template assets and scaffold emission. | Default Aspire-backed init emits Compose/GHCR, Deno Deploy, and bare-metal GitHub Actions templates; `--no-aspire` omits the Aspire-backed Compose/GHCR workflow. |
| 2026-07-06 | Implemented deploy target CI flags. | `deploy <compose|docker> <op>` accepts `--environment`, `--non-interactive`, and `--clear-cache`; Aspire adapter forwards environment/non-interactive to publish/deploy and clear-cache to `aspire deploy`. |
| 2026-07-06 | Updated docs/readme generation. | Generated README and `docs/site/how-to/deploy.md` document generated workflows, `development -> staging -> production` promotion, and non-persistence of `~/.aspire/deployments` in CI. |
| 2026-07-06 | Ran focused tests. | `deno test --allow-all packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target_test.ts packages/cli/src/public/features/deploy/target/target-deploy-command_test.ts packages/cli/src/kernel/application/scaffold/plan-init_test.ts packages/cli/src/kernel/templates/workspace/generators_test.ts` passed: 30 passed. |
| 2026-07-06 | Ran scoped check/lint/fmt evidence. | 12 touched CLI TS files clean via scoped `run-deno-check`, direct `deno lint --no-config --rules-exclude=no-import-prefix`, and direct `deno fmt --check --no-config --single-quote=true --line-width 100 --indent-width 2`. |
| 2026-07-06 | Ran affected package tests. | `rtk proxy deno task --cwd packages/cli test` passed: 311 passed, 0 failed. |
| 2026-07-06 | Ran public surface gates. | `run-deno-doc-lint --root packages/cli` passed with 0 errors after re-exporting `CacheBackendChoice`; `rtk proxy deno task publish:dry-run` passed. |
| 2026-07-06 | Ran final repo validation. | `rtk proxy deno task check` passed: 2102 files, 18 batches, 0 occurrences. `rtk proxy deno task test` passed: 1527 passed, 0 failed, 12 ignored. |
| 2026-07-06 | Ran architecture gate. | `rtk proxy deno task arch:check` exited 0 with existing WARN/INFO items outside this slice. |
| 2026-07-06 | Fixed adversarial review caveat 1. | Replaced generated/docs `deploy compose emit` with the routed `deploy compose plan` verb in the source templates, embedded asset mirror, and deploy how-to. |
| 2026-07-06 | Fixed adversarial review caveat 2. | Replaced generated bare-metal `deploy build --deploy-dir` with the real `--output-dir` flag in the source template and embedded asset mirror. |
| 2026-07-06 | Closed scaffold test-honesty gap. | Added a parser-backed scaffold test that extracts every emitted `netscript deploy ...` workflow invocation and parses it through `createDeployCommand()` with no-op deploy adapters. |
| 2026-07-06 | Ran caveat-fix focused validation. | Focused scaffold test passed: 3 passed. Affected CLI test set passed: 39 passed. Scoped check on 4 changed TS files passed. Stale-string grep for `deploy compose emit` and `--deploy-dir` returned no matches. |
| 2026-07-06 | Ran caveat-fix package/root/public validation. | `rtk proxy deno task --cwd packages/cli check` passed. `rtk proxy deno task --cwd packages/cli test` passed: 312 passed, 0 failed. `rtk proxy deno task check` passed: 2102 files, 18 batches, 0 occurrences. `rtk proxy deno task test` passed: 1528 passed, 0 failed, 12 ignored. `deno doc --lint mod.ts scaffolding.ts testing.ts` from `packages/cli` passed. `rtk proxy deno task publish:dry-run` passed with existing dynamic-import warnings. |

## Reconcile Notes

- Pre-implementation reconcile: no product code changed; issue #347 scope is unblocked by closed #342/#343 per issue body.
- Implementation reconcile: no file-level sibling collision observed; no `deno.lock` churn; `deno task e2e:cli` intentionally not run per slice instructions.
