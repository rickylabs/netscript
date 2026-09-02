# Worklog: `/design` production exclusion

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `design-route-prod-gate--plan` |
| Branch | `fix/design-route-prod-gate` |
| Archetype | 6 — CLI / Tooling |
| Scope overlays | Frontend |

## Design

### Public Surface

- No published CLI command, exported type, package entrypoint, or JSDoc surface changes.
- Generated-app contract changes: `/design` is present in development and absent/refused outside literal development.
- E2E contract adds gate ID `scaffold.design-production-exclusion` to `scaffold.runtime`.

### Domain Vocabulary

- `design route group` — generated `routes/(design)/design/**` developer reference modules.
- `structural exclusion` — Fresh does not crawl/import those modules for a production build.
- `runtime refusal` — route-group middleware returns 404 without delegation outside literal development.
- `production exclusion probe` — clean build assertion plus a controlled mutation that proves the detector can fail.

No new public interfaces or discriminated unions are required.

### Ports

- Existing `TemplateAssetPort`/template registry path loads the middleware template.
- Existing scaffold file-system abstraction emits it.
- Existing E2E command executor runs the generated `deno task build`.
- No new port is introduced.

### Constants

- `GATE.SCAFFOLD_DESIGN_PRODUCTION_EXCLUSION` → `scaffold.design-production-exclusion`.
- A local stable design build marker and cross-platform route-group regexp are named beside the production probe/config that consumes them; no package-global abstraction is warranted.

### Archetype-6 checkpoint

- Five existing spine abstracts remain unchanged: `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`, `UseCase<Input, Result>`, and `Registry<TKey, TValue>`.
- No layer-2 abstract, extension axis, registry, command, feature, composition root, adapter, or permission declaration changes.
- Generated output: one `_middleware.ts` plus changed `vite.config.ts`; embedded template registry gains the middleware asset.
- Semantic strategy: focused template/materialization tests, hosted production build inspection, mutation failure proof, and existing dev HTTP probe.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove dual exclusion and non-vacuity: RED tests; middleware/manifest/writer/Vite config; regenerate embedded barrel; register hosted production build probe; update run evidence. | Focused structured tests; embedded freshness; scoped check/lint/fmt; `quality:gate`; `arch:check`; hosted `scaffold.runtime` via `ci:full` | Files enumerated in `plan.md` § File list plus run artifacts |

One implementation slice is appropriate because the middleware template, embedded barrel, writer plumbing, and production gate form one atomic acceptance contract; separating them would leave either an unpublished asset or an unproved exclusion.

### Deferred Scope

- Production opt-in — no repository contract requires it; future work must retain two independent exclusions.
- Navigation removal from production pages — route URL strings are not route modules; only pursue if bundle/runtime evidence shows a user-facing dangling-link defect within this acceptance scope.
- General E2E scaffold-directory remediation — owned by debt `scaffold-runtime-a8-f16-1333`; this slice avoids deepening it.
- UI appearance/browser responsive work — no visual change.

### Contributor Path

To change a scaffold template, edit its `.template` source, register it in `assets/manifest.ts`, load/write it through the existing scaffold-template map/writer, run `deno task gen:assets-barrel`, and prove freshness. To add a scaffold E2E assertion while the scaffold directory debt remains open, extend the closest role-named existing gate family rather than adding another top-level sibling.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02T17:27:31Z | Plan | Research | Re-baselined #1481/RFC 0005 against `origin/main` `850cc7757`; inspected positioning, generated README/templates, Fresh docs/API, writer/manifest/barrel generator, and closest E2E mutation pattern. |
| 2026-09-02T17:27:31Z | Plan | Design | Locked developer-only intent and both independent exclusion mechanisms; selected Archetype 6 + frontend overlay. |
| 2026-09-02T17:27:31Z | Plan | Gate status | PLAN-EVAL selected and pending. No implementation or later-phase gate was run. |
| 2026-09-02T19:02:00Z | Implement | Plan gate | Resumed only after separate-session `PASS_PLAN` at `5566a89f6` for plan head `f8ed75b41`. |
| 2026-09-02T19:10:00Z | Implement | RED 1 | Added focused middleware/config/materialization expectations and `scaffold.design-production-exclusion` registration/order expectations. The structured test wrapper failed as required: missing `TEMPLATE_KEYS.appRoutesDesignMiddleware` and missing `GATE.SCAFFOLD_DESIGN_PRODUCTION_EXCLUSION` (exit 1, five type errors). No implementation exists in this step. |
| 2026-09-02T19:15:00Z | Implement | RED 2 | `scaffold.design-production-exclusion` production-build baseline probe is `HOSTED_PENDING` under `ci:full`. Per the coordinator constraint, no local `e2e:cli`, Aspire, or Docker command was run. |
| 2026-09-03T00:35:00Z | Implement | GREEN 3 | Added the typed middleware asset, scaffold load/write plumbing, fail-closed runtime middleware, Vite-mode structural ignore, gate ID/command, mutation/restoration probe, and runtime-suite selection. Focused E2E registration/order tests pass 32/32. Structured E2E-source check reaches only the intentional Step-4 stale-barrel error (`TS2741` for the new middleware asset key). |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| `/design` is development-only | All affirmative prose describes a local customization reference/gallery; no production-user contract exists. | `research.md` F1-F5 |
| Deliver both exclusions | Fresh supports structural ignore; generated route middleware supplies independent runtime refusal. | RFC 0005 H-4/H-8; `research.md` F6-F8 |
| Extend generated-quality E2E files | Closest mutation pattern and avoids deepening an over-cap directory. | `research.md` F10-F11 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| `packages/cli/e2e/suites/scaffold/capability-suites.ts` was omitted from the plan file list but is the existing selector required to put the new registered gate into `scaffold.runtime`. | minor | `drift.md` D-1; bounded inside `packages/cli/**` with no new gate-directory child |

## Gate Results

| Gate | Status | Evidence |
| --- | --- | --- |
| PLAN-EVAL | PASS | `plan-eval.md`; evaluator commit `5566a89f6`, plan head `f8ed75b41` |
| RED focused tests | EXPECTED_FAIL | Structured `run-deno-test.ts` over five focused unit/E2E files exited 1 with missing middleware asset key and gate ID; 2026-09-02 |
| GREEN 3 focused E2E tests | PASS | Structured `run-deno-test.ts`; 32 passed, 0 failed |
| GREEN 3 source check | EXPECTED_STEP_BOUNDARY | Structured `run-deno-check.ts --root packages/cli/e2e/src --ext ts,tsx`; only stale embedded-barrel `TS2741`, to be resolved by GREEN 4 |
| Local GREEN rows 1–7 | NOT_RUN | Awaiting generated-barrel step |
| Hosted development behavior | HOSTED_PENDING | Existing `behavior.app-reference`; local runtime E2E prohibited |
| Hosted production exclusion | HOSTED_PENDING | New `scaffold.design-production-exclusion` baseline/mutation/restoration probe under `ci:full` |

## Handoff Notes

- PLAN-EVAL should challenge the runtime-signal independence and the selected route-only bundle marker first.
- Implementation must stop if dev Vite does not expose a literal-development runtime signal; do not substitute an unset→development default.
- Runtime E2E remains hosted-only under `ci:full`; no local run without a coordinator lease.
