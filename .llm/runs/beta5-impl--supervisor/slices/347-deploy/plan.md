# Plan

## Archetype

- **Selected:** Archetype 7 — Deployment Target Adapter.
- **Composed surfaces:** Archetype 6 CLI/tooling (`packages/cli` scaffold generation and deploy adapter), with Archetype 2 integration concerns for the Aspire target adapter.
- **Scope overlays:** Docs overlay for generated README/site docs; Aspire skill applies to `aspire deploy` cache behavior.
- **Current doctrine verdict:** `@netscript/cli` is still a restructure package in doctrine file 10; new work must not deepen existing AP-1/AP-21 debt.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Add workflow templates as checked-in CLI template assets under `packages/cli/src/kernel/assets/workspace/github/workflows/`. | Keeps generation in the existing asset registry instead of embedding long YAML strings in application code. |
| D2 | Extend `loadRootScaffoldTemplateAssets()` and `scaffoldRoot()` to write `.github/workflows/deploy-*.yml`. | Root scaffold planning already owns root files and directories; workflows are generated project root files. |
| D3 | Generate three workflows: compose/GHCR, Deno Deploy push, and bare-metal compile artifact. | Matches the issue's shipped-target template list exactly. |
| D4 | Do not cache `~/.aspire/deployments` in generated CI; use `aspire deploy --clear-cache --non-interactive --environment <env>` where Aspire deployment is needed. | Aspire docs state cache files can contain plaintext secrets and `--clear-cache` does not save prompted values. |
| D5 | Document environment promotion as explicit environment names and protected GitHub environments: development -> staging -> production. | Aspire already keys deployment state by `--environment`; GitHub environments provide approval/secret boundaries. |
| D6 | Keep target-specific business logic out of the deploy router. | S11 templates and adapter options belong in assets/adapters, not `deploy-group.ts`. |

## Open-Decision Sweep

| Decision | Status | Why Safe |
| --- | --- | --- |
| Whether to add a new `netscript generate ci` command | Safe to defer | Acceptance does not require a command; init-time scaffold templates satisfy generated templates without expanding CLI surface. |
| Whether to encrypt Aspire deployment cache | Safe to defer | Aspire's documented safe CI path for this slice is not persisting the cache. Encryption would require a separate state-store contract beyond S11. |
| Whether live cloud deployment is validated | Safe to defer | Credentials are unavailable in this slice; unit tests assert argv and generated templates. Supervisor owns expensive/runtime E2E. |

## Commit Slices

| Slice | Proves | Files | Gates |
| --- | --- | --- | --- |
| S11-A | Workflow templates are registered and emitted by scaffold root generation. | `packages/cli/src/kernel/assets/manifest.ts`, new `packages/cli/src/kernel/assets/workspace/github/workflows/*.yml.template`, `packages/cli/src/kernel/assets/embedded.generated.ts`, `packages/cli/src/kernel/adapters/templates/scaffold-template-assets.ts`, `packages/cli/src/kernel/application/scaffold/plan-init.ts`, focused scaffold/template tests. | Focused Deno tests; scoped check/lint/fmt for `packages/cli/src/kernel/{assets,adapters/templates,application/scaffold,templates/workspace}`; consumer check that scaffold root output contains all three workflow files. |
| S11-B | Aspire deploy CI path avoids plaintext cache persistence and records environment promotion behavior. | `packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target.ts`, `packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target_test.ts`, docs. | Focused adapter test; scoped check/lint/fmt on adapter root; F-DEPLOY-2 reviewed evidence that router remains thin and cache policy stays in adapter/template docs. |
| S11-C | Generated and site docs describe workflow usage, cache hardening, and dev -> staging -> prod promotion. | `packages/cli/src/kernel/templates/workspace/generate-readme.ts`, `packages/cli/src/kernel/templates/workspace/generators_test.ts`, `docs/site/how-to/deploy.md` or focused deployment doc. | Focused generator tests; docs validation when available; reviewed evidence that docs do not overclaim live cloud deployment. |
| S11-D | Final validation and PR trail. | Run artifacts under this slice dir. | Touched-root wrappers, focused tests, full `deno task check`, full `deno task test`, `deno task arch:check` for universal/F-CLI/F-DEPLOY reviewed evidence, consumer scaffold/import validation. Supervisor merge-readiness triggers `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`; this implementation slice does not run it per briefing. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| YAML templates drift from generated project commands. | Keep workflows conservative and reference existing CLI commands; test emitted files include required trigger, secret, and command lines. |
| Generated asset barrel churn is broad. | Use `deno task gen:assets-barrel` and inspect diff; do not hand-edit generated barrel. |
| Aspire `--clear-cache` still prompts on missing values in CI. | Generated workflow supplies required values through GitHub environment secrets and uses `--non-interactive`; docs warn not to cache plaintext state. |
| Docs claim more target maturity than code supports. | State exact current target behavior: Deno Deploy command, Aspire compose/docker adapter, bare-metal compile workflow. |

## Gate Set

- Static gates:
  - scoped check/lint/fmt wrappers on touched TypeScript roots with `--ext ts,tsx`;
  - focused Deno tests for template generation, scaffold emission, generated README text, and Aspire adapter argv;
  - full `deno task check`;
  - full `deno task test`.
- Universal fitness evidence:
  - `deno task arch:check` as the mechanical doctrine gate backing F-1, F-3, F-5, F-10, F-11, F-12, F-15, F-16, F-17, F-18, and related CLI package checks;
  - manual reviewed evidence for F-2/F-4/F-8/F-9/F-14/F-19 where scripts do not directly cover this slice or the gate is not touched.
- Archetype 6 evidence:
  - F-CLI-1 through F-CLI-31 recorded as `PENDING_SCRIPT` with manual/structural evidence, backed by `deno task arch:check`;
  - explicit F-CLI-21/F-CLI-22/F-CLI-24 evidence for workflow templates under `kernel/assets/**` and manifest/embedded asset consistency;
  - explicit F-CLI-27/F-DEPLOY-2 evidence that no target-specific business logic is added to the deploy command router.
- Archetype 7 evidence:
  - F-DEPLOY-1 reviewed evidence that first-party target registrations still advertise the supported uniform-operation subset;
  - F-DEPLOY-2 reviewed evidence that CI/cache/secrets conventions live in assets/adapters/docs, not in router logic.
- Consumer validation:
  - generated scaffold root emits `.github/workflows/deploy-compose-ghcr.yml`, `.github/workflows/deploy-deno-deploy.yml`, and `.github/workflows/deploy-bare-metal.yml`;
  - generated workflow command lines reference existing public CLI/deploy commands and avoid caching `~/.aspire/deployments`.
- Release/merge-readiness gate:
  - because this slice changes scaffold output, the supervisor merge-readiness pass must trigger the one-pass `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`;
  - this implementation slice must not run `deno task e2e:cli` during implementation, per briefing.
- Public surface doc-lint/publish dry-run only if implementation changes package exports or public symbols.

## Deferred Scope

- New `netscript generate ci` command.
- Encrypted Aspire deployment-state cache or custom state-store provider.
- Live GHCR, Deno Deploy, Azure, or remote host deployment.
- Sibling issue #346/#348 scope.
