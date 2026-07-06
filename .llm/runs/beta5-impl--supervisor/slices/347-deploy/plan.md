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
| S11-A | Workflow templates are registered and emitted by scaffold root generation. | `packages/cli/src/kernel/assets/manifest.ts`, new `packages/cli/src/kernel/assets/workspace/github/workflows/*.yml.template`, `packages/cli/src/kernel/assets/embedded.generated.ts`, `packages/cli/src/kernel/adapters/templates/scaffold-template-assets.ts`, `packages/cli/src/kernel/application/scaffold/plan-init.ts`, focused scaffold/template tests. | Focused Deno tests; scoped check/lint/fmt for `packages/cli/src/kernel/{assets,adapters/templates,application/scaffold,templates/workspace}`. |
| S11-B | Aspire deploy CI path avoids plaintext cache persistence and records environment promotion behavior. | `packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target.ts`, `packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target_test.ts`, docs. | Focused adapter test; scoped check/lint/fmt on adapter root. |
| S11-C | Generated and site docs describe workflow usage, cache hardening, and dev -> staging -> prod promotion. | `packages/cli/src/kernel/templates/workspace/generate-readme.ts`, `packages/cli/src/kernel/templates/workspace/generators_test.ts`, `docs/site/how-to/deploy.md` or focused deployment doc. | Focused generator tests; docs compile not required unless existing docs task is cheap and available. |
| S11-D | Final validation and PR trail. | Run artifacts under this slice dir. | Touched-root wrappers, focused tests, full `deno task check`, full `deno task test`. No `deno task e2e:cli`. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| YAML templates drift from generated project commands. | Keep workflows conservative and reference existing CLI commands; test emitted files include required trigger, secret, and command lines. |
| Generated asset barrel churn is broad. | Use `deno task gen:assets-barrel` and inspect diff; do not hand-edit generated barrel. |
| Aspire `--clear-cache` still prompts on missing values in CI. | Generated workflow supplies required values through GitHub environment secrets and uses `--non-interactive`; docs warn not to cache plaintext state. |
| Docs claim more target maturity than code supports. | State exact current target behavior: Deno Deploy command, Aspire compose/docker adapter, bare-metal compile workflow. |

## Gate Set

- Scoped wrappers for touched TypeScript roots with `--ext ts,tsx`.
- Focused Deno tests for template generation and Aspire adapter argv.
- Full `deno task check`.
- Full `deno task test`.
- Public surface doc-lint/publish dry-run only if implementation changes package exports or public symbols.
- Do not run `deno task e2e:cli`.

## Deferred Scope

- New `netscript generate ci` command.
- Encrypted Aspire deployment-state cache or custom state-store provider.
- Live GHCR, Deno Deploy, Azure, or remote host deployment.
- Sibling issue #346/#348 scope.
