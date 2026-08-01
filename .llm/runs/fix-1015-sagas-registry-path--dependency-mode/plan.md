# Plan: dependency-safe sagas registry resolution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1015-sagas-registry-path--dependency-mode` |
| Branch | `fix/1015-sagas-registry-path` |
| Phase | `plan` |
| Target | `plugins/sagas` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | `service` |

## Archetype

Archetype 5 applies because this is a first-party plugin. The service overlay applies to API init,
the background runtime, and Aspire environment wiring. The change remains thin project-boundary
wiring and does not redefine saga-core contracts.

## Current Doctrine Verdict

`plugins/sagas`: **Keep** — doctrine-aligned shape. This fix must not deepen existing debt or move
registry-loading conventions into the core package.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A6 | The helper is justified by shared NetScript project-root policy plus injected test seams. |
| A7 | URL construction uses the Web Platform `URL` primitive. |
| A12 | A non-empty registry is required for the saga runtime to execute declared state machines. |
| A14 | Dependency-shaped and Windows-path tests preserve the published runtime boundary. |

## Goal

Resolve every default saga registry reference to an absolute consumer-project `file://` URL, with
explicit argument then environment then project-root fallback precedence, independent of package
module location.

## Scope

- Add one internal, unit-testable project-root registry URL resolver.
- Route service init and saga runner through it.
- Emit the absolute registry URL from Aspire using `ctx.projectRoot`.
- Add dependency-shape, precedence, Windows/backslash, and Aspire environment tests.

## Non-Scope

- Do not change Aspire resource entrypoint strings.
- Do not install from JSR or run scaffold runtime E2E.
- Do not change generated runtime glue text.

## Hidden Scope

- Service init needs an explicit options seam and importer injection so its precedence and
  dependency-mode behavior can be tested without dynamic filesystem imports.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Put the shared resolver under `src/runtime/` and consume it from both runtime and service init. | Registry resolution is runtime composition policy and needs one tested owner. |
| D2 | Resolve explicit and env leading-dot paths against project root; preserve already absolute URL/module specifiers. | Meets precedence while preventing package-relative inference. |
| D3 | Inject env reader and cwd into the helper; allow explicit project root for Aspire. | Deterministic unit tests across OS hosts. |
| D4 | Leave emitted glue source byte-identical. | It already supplies an absolute project-owned URL; changing it requires a user decision. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Public export for resolver | safe to defer | Not required while glue remains unchanged; internal imports suffice. |
| Aspire entrypoints | safe to defer | Explicitly out of scope even if dependency mode exposes a separate defect. |
| Canonical project-root resolver home (`packages/plugin` vs per-plugin) | safe to defer | Hoisting the policy would add or change a shared public surface and touch sagas, workers, and triggers; that is outside a fixes-only 0.0.3 change. |

## Commit Slices

| Order | Slice and proof obligation | Proving gate | Files |
| --- | --- | --- | --- |
| 1 | Shared resolver proves explicit → env → project-root precedence, absolute-specifier preservation, and Windows drive/backslash handling through injected env/cwd seams. | focused resolver unit tests | `plugins/sagas/src/runtime/project-registry-module.ts`, focused test under `plugins/sagas/tests/runtime/`, run artifacts |
| 2 | Runner proves its fallback resolves to an absolute consumer-project URL and a dependency-shaped importer loads non-empty saga definitions without package-relative anchoring. | focused `startSagaRunner` test + scoped check | `plugins/sagas/src/runtime/saga-runner.ts`, runner test under `plugins/sagas/tests/runtime/`, run artifacts |
| 3 | API initialization proves explicit/env/fallback precedence through the same resolver and importer seam, registering non-empty definitions. | focused `registerSagas` test + scoped check | `plugins/sagas/services/src/init.ts`, service test under `plugins/sagas/tests/services/`, run artifacts |
| 4 | Aspire contribution declares the absolute project-owned URL for future consumers, while documentation and final gates distinguish that declaration from the load-bearing runtime fallback. | Aspire contribution test + complete requested validation | `plugins/sagas/src/aspire/sagas-contribution.ts`, `plugins/sagas/tests/aspire/sagas-contribution_test.ts`, run artifacts |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Windows drive paths produce malformed URLs on Linux-hosted tests. | Test injected `C:\\...` roots and backslashes explicitly. |
| Existing absolute `file:`, `jsr:`, or other URL specifiers are rewritten. | Preserve non-leading-dot/non-project-relative specifiers and test precedence. |
| API service remains on a separate loading path. | Give `registerSagas` the same resolver and importer seams as the runner. |
| Glue golden churn expands scope. | Do not edit `runtime.stub.ts`; verify its tests remain green. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-11 | existing risk | Keep loading explicit and injected; remove implicit package-location discovery. |
| AP-19 | existing risk | Declare the registry URL in Aspire environment. |
| AP-25 | risk | Keep Deno env/cwd access at injected runtime edge seams. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-3/F-5 | yes | scoped check plus review of internal/public surface |
| F-6/F-7 | yes | JSR audit shows no export-map change; doc-lint/publish risks unchanged |
| F-9 | yes | Aspire env test asserts a forward-looking `SAGAS_REGISTRY_MODULE` declaration; `declareEnv` currently has no production caller and is not acceptance evidence. |
| F-10/F-13 | yes | dependency-mode runtime tests load non-empty definitions |
| F-19 | yes | scoped wrapper evidence |
| Acceptance 1 runtime path | yes | Resolver tests prove the load-bearing fallback derives an absolute project URL from `NETSCRIPT_PROJECT_ROOT ?? Deno.cwd()`. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | note/defer | `projectFileUrl` is duplicated in sagas, workers, and triggers glue. A canonical shared home would alter `packages/plugin` public surface and is deferred beyond this fixes-only milestone; do not deepen it beyond the sagas runtime resolver required here. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | check | `deno run -A .llm/tools/run-deno-check.ts --root plugins/sagas --ext ts` | exit 0 |
| 2 | format | `deno fmt --check plugins/sagas` plus harness wrapper evidence | exit 0 |
| 3 | lint | `deno lint plugins/sagas` plus harness wrapper evidence | exit 0 |
| 4 | tests | `deno test -A plugins/sagas/tests/` | exit 0, non-empty dependency-shape registry asserted |
| 5 | Aspire tests | resource and contribution tests | exit 0 |
| 6 | acceptance grep | `rg "import\\.meta\\.url" plugins/sagas/` | no registry-path resolution matches |
| 7 | doctrine quality | `deno task quality:gate` | exit 0 or scoped pre-existing findings recorded |

## Dependencies

- Web Platform `URL`; no dependency changes.

## Drift Watch

- Any need to alter generated glue text or Aspire entrypoints requires stopping/rescoping.
- Any public export-map change requires renewed JSR surface review.
