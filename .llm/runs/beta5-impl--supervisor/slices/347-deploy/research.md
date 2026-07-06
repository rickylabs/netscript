# Research

## Issue Scope

Issue #347 requires exactly:

- generated GitHub Actions workflow templates per shipped deploy target;
- Aspire deployment-state caching no longer persists plaintext secrets in CI, with documented handling;
- a documented promotion path between Aspire environments `dev -> staging -> prod`.

Dependencies #342 and #343 are closed, so the slice is unblocked. Parent epic is #327.

## Re-Baseline Findings

| ID | Finding | Evidence |
| --- | --- | --- |
| R1 | The current deploy surface already has the canonical 7-op target contract. | `deno doc packages/cli/src/kernel/domain/deploy/deploy-target-port.ts` shows `plan`, `emit`, `up`, `down`, `status`, `logs`, `rollback`, `secrets`, plus legacy aliases. |
| R2 | Shipped deploy targets in scope are `deno-deploy`, `compose`, and bare-metal compile/OS-service. | `packages/config/src/domain/schemas/deploy-schema.ts` documents `deno-deploy`, `docker`/`compose`, `linux`, and `windows`; issue scope names compose -> GHCR, Deno Deploy push, and bare-metal compile. |
| R3 | Workflow templates are absent from the CLI asset manifest today. | `packages/cli/src/kernel/assets/manifest.ts` has workspace, app, Aspire, database, service, plugin, and Windows env templates, but no `.github/workflows/*` keys. |
| R4 | Root scaffold planning is the correct write point for generated workflows. | `packages/cli/src/kernel/application/scaffold/plan-init.ts` writes root-level `.gitignore`, `README.md`, `deno.json`, `netscript.config.ts`, and uses `loadRootScaffoldTemplateAssets()`. |
| R5 | Embedded template content is generated and must not be hand-edited. | `packages/cli/src/kernel/assets/embedded.generated.ts` says to run `deno task gen:assets-barrel`; `.llm/tools/generate-cli-assets-barrel.ts` reads `TEMPLATE_MANIFEST`. |
| R6 | The Aspire compose adapter delegates `plan`/`emit` to `aspire publish --output-path` and docker `up` to `aspire deploy`. | `packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target.ts`. |
| R7 | Aspire CLI `deploy` supports `--clear-cache`, and help states it clears deployment cache and does not save deployment state. | `aspire deploy --help` output on 2026-07-06. |
| R8 | Aspire docs confirm deployment cache files contain plaintext secrets and live at `~/.aspire/deployments/{AppHostSha}/{environment}.json`; `--clear-cache` performs a deployment without persisting new values. | `aspire docs get deployment-state-caching` on 2026-07-06. |
| R9 | Existing deploy secrets convention already centralizes env-file rendering and restricted permissions. | `packages/cli/src/kernel/domain/deploy/secrets-convention.ts` and `packages/cli/src/kernel/adapters/secrets/env-file-secrets-store.ts`. |
| R10 | Current docs under `docs/site/how-to/deploy.md` still describe Docker/Compose/Linux as config-schema only, which conflicts with the now-landed target adapters. | `docs/site/how-to/deploy.md` lines found by `rtk rg` mention no runnable `netscript deploy docker|compose|linux` verb. |

## Open Questions

- OQ1: Whether a separate CLI command should generate workflows on demand or workflows should be emitted by `netscript init`. Plan locks to init-time generated templates because the acceptance says "Generated GH Actions workflow templates" and the existing scaffold asset system is the established generation path.
- OQ2: Whether to preserve Aspire deployment cache in CI with encryption. Plan locks to no plaintext cache persistence for generated CI by using `aspire deploy --clear-cache --non-interactive --environment <env>` and no `actions/cache` over `~/.aspire/deployments`.

## JSR / Public Surface Scan

This slice changes `packages/cli` internals and scaffold output, not package exports or `mod.ts`. No new public TypeScript export is planned. Publish-surface risk is limited to generated asset registration and generated docs text; `deno task publish:dry-run` is not required by the issue unless implementation unexpectedly changes export maps or public symbols.
