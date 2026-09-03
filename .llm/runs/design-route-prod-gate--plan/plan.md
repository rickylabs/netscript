# Plan: gate `/design` out of production builds

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `design-route-prod-gate--plan` |
| Branch | `fix/design-route-prod-gate` |
| Phase | `plan` — hard stop pending separate-session PLAN-EVAL |
| Target | `packages/cli` scaffolded Fresh application and CLI E2E harness |
| Archetype | 6 — CLI / Tooling |
| Scope overlays | Frontend |

## Decision: production intent

`/design` is a **developer-only design-system explorer/reference**, not a production-user product surface.

Evidence, evaluated before selecting a mechanism:

- `docs/site/_plan/01-positioning-brief.md:31-32` lists “`/design` token + component reference routes” among files/capabilities copied into a scaffold. It proves scaffold inclusion, not deployed reachability.
- The generated root README (`packages/cli/src/kernel/templates/workspace/generate-readme.ts:50-76,127-163`) tells users to start the Fresh Vite **dev** task and never advertises `/design` as deployment functionality.
- `docs/site/web-layer/fresh-ui.md:193-206` calls it a live gallery for seeing components and tokens copied into the developer’s project.
- `docs/site/web-layer/how-to/customize-fresh-ui.md:50-67` places “Start at `/design`” directly in the local Aspire/Vite development loop and tells users to use it before editing their UI.
- Scaffold templates call it “Design reference,” “Living index,” and “Browse design” (`routes/index.tsx.template:32-36`, `routes/(_components)/home-view.tsx.template:31-43`). These links are current defect evidence, not a production contract.

Therefore the locked default is **development-only with no production bypass in this slice**. A later explicit production opt-in is safe to defer, but must preserve the RFC’s independent exclusions (two separately derived acknowledgements, not one shared flag).

## Archetype and doctrine

- **Archetype 6:** the package ships scaffold/CLI flows; generated Fresh files are outputs of that tooling.
- **Frontend overlay:** route discovery, middleware behavior, production output, and the existing dev browser reference route are affected.
- **Current doctrine verdict:** `Keep` — preserve the Archetype-6 kernel/surface split (`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:33`).
- **Axioms:** A7 (use Fresh’s upstream `ignore` API), A8 (do not add another over-cap scaffold-gate sibling), A14 (semantic production-build and mutation proofs).
- **Anti-patterns:** avoid AP-1 (do not grow a new probe monolith), AP-11/AP-25 (runtime env read lives in generated route middleware, an application edge), AP-18 (assert semantic marker/path absence rather than snapshotting a bundle), and AP-21 (respect the recorded over-cap E2E directory stop condition).

## Goal

A default scaffold retains `/design` during development, while a production build has no `(design)` route module in its Fresh build graph and the route group independently refuses at runtime unless the runtime mode is literally `development`.

## Locked mechanism: RFC 0005 dual exclusion

### M1 — structural exclusion (delivered)

- Update `app/vite.config.ts.template` so `fresh(...)` receives an `ignore` regexp for `routes/(design)/**` when the Vite config callback’s `mode` is not `development` (production is the exercised case).
- Development mode supplies no design ignore, preserving the local gallery and the existing `behavior.app-reference` dev probe.
- The structural signal is Vite’s build-mode callback; it does not depend on the runtime middleware signal.
- Keep template, `generateAppViteConfig()` tests, and embedded content synchronized.

### M2 — fail-safe runtime refusal (delivered)

- Add `app/routes/(design)/design/_middleware.ts.template` and emit it from `write-app-files.ts`.
- The middleware derives the project runtime mode from `MODE` and then `NODE_ENV`; if the result is anything other than the literal `development` (including unset, misspelled, staging, test, or production), return a non-revealing 404 without calling `ctx.next()`.
- The runtime signal is independent of Vite’s build `mode`. The existing dev runtime probe must continue to reach `/design/composition`, proving the real dev environment supplies the expected runtime signal.
- No opt-in bypass is added because the evidence establishes no production product contract. This is stricter than the issue’s “absent ... or explicit opt-in” alternative and matches RFC H-4.

### Divergence ruling

No divergence from RFC 0005 §5 is planned: both independent mechanisms land in this slice. If implementation evidence shows Vite does not expose a literal-development runtime environment to generated middleware, stop and record significant drift rather than weakening the fail-closed polarity or coupling it to Vite build mode.

## E2E gate and non-vacuity

Add gate ID **`scaffold.design-production-exclusion`** to the existing generated-quality gate family, after `scaffold.init` and before runtime startup:

1. Run the generated app’s `deno task build` with the default production mode.
2. Walk `_fresh/` and fail if any file path or decoded text contains stable route-module evidence: the `(design)` source path or the existing route-only literal `Composition rules — NetScript design system` from `composition.tsx.template`. Do not use `/design` alone because non-route navigation metadata may legitimately retain the string.
3. Prove the assertion is non-vacuous in the same probe: temporarily remove the generated Fresh `ignore` rule (the controlled “plant the route back”), rebuild cleanly, and require the detector to fail on the planted design marker.
4. Restore the generated config, remove stale `_fresh` output, rebuild, and require the clean exclusion assertion to pass so later gates never consume the mutation fixture.

Closest pattern to copy: **`generated.quality-negative`**, implemented by `createGeneratedQualityGates()` plus `generated-quality-probes.ts`; it already uses plant → require failure → restore → require green semantics. To honor open debt `scaffold-runtime-a8-f16-1333`, extend these existing files rather than adding another top-level child under `gates/scaffold/`.

The production-build gate is registered into `scaffold.runtime` and runs **hosted only under `ci:full`**. It is never invoked locally without a coordinator lease.

## File list

### Scaffold mechanism

- `packages/cli/src/kernel/assets/app/vite.config.ts.template` — production Fresh ignore rule.
- `packages/cli/src/kernel/assets/app/routes/(design)/design/_middleware.ts.template` — fail-safe runtime refusal.
- `packages/cli/src/kernel/assets/manifest.ts` — typed middleware asset key.
- `packages/cli/src/kernel/adapters/templates/scaffold-template-assets.ts` — load the middleware asset.
- `packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts` — emit middleware beside design layout/routes.
- `packages/cli/src/kernel/assets/embedded.generated.ts` — generator-produced embedded template content; never hand edit.

### Focused tests

- `packages/cli/src/kernel/templates/app/route-templates_test.ts` — middleware polarity/unset refusal and development pass-through contract.
- `packages/cli/src/kernel/templates/app/generators-config_test.ts` — Vite production ignore and development inclusion contract.
- Existing scaffold writer/integration test under `packages/cli/src/**` selected after confirming the narrowest fixture — assert `_middleware.ts` is materialized.

### Hosted E2E gate

- `packages/cli/e2e/src/domain/cli-surface.ts` — `scaffold.design-production-exclusion` constant.
- `packages/cli/e2e/src/application/gates/scaffold/generated-quality-gate.ts` — command-gate registration.
- `packages/cli/e2e/src/application/gates/scaffold/generated-quality-probes.ts` — production build detector, plant/restore mutation proof, and final clean rebuild.
- `packages/cli/e2e/tests/application/gates/scaffold-gates_test.ts` — command/cwd/order registration assertions.
- `packages/cli/e2e/tests/presentation/suite-registry_test.ts` — `scaffold.runtime` inclusion/order assertion.

### Run state

- `.llm/runs/design-route-prod-gate--plan/{supervisor,research,plan,worklog,context-pack,drift}.md`
- `.llm/runs/design-route-prod-gate--plan/codex-thread-ids.md` (launcher-produced session identity)

No file outside `packages/cli/**` and this run directory is authorized. Any required change elsewhere triggers a drift entry and supervisor rescope.

## RED / GREEN sequence

| Order | State | Action | Proof |
| --- | --- | --- | --- |
| 1 | RED | Add focused template/config expectations and `scaffold.design-production-exclusion` registration tests before implementation. | Tests fail because middleware asset, Fresh ignore, and gate ID/registration do not exist. |
| 2 | RED | Run the hosted production probe on the baseline scaffold. | Default production build contains the planted design route marker; gate exits non-zero. Hosted only under `ci:full`. |
| 3 | GREEN | Add manifest/load/write plumbing and fail-safe middleware; add Vite production ignore. | Focused package tests pass; existing development reference probe still reaches `/design/composition`. |
| 4 | GREEN | Regenerate all embedded assets with `deno task gen:assets-barrel`; never edit `embedded.generated.ts` directly. | `deno run --allow-read --allow-write --allow-run .llm/tools/generate-cli-assets-barrel.ts --check` (or `deno task check:assets-barrel`) reports fresh output. |
| 5 | MUTATION RED | In the hosted gate, remove the generated ignore rule and rebuild. | The same exclusion detector must reject the planted route marker. |
| 6 | RESTORED GREEN | Restore config, delete stale build output, rebuild production, then continue suite. | Exclusion detector passes and later `scaffold.runtime` gates see an unmodified project. |

## Validation plan (later implementation phase; not run in PLAN)

| Order | Gate | Command/check | Expected result |
| --- | --- | --- | --- |
| 1 | Check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/src --ext ts,tsx` | PASS |
| 2 | Focused tests | Structured test wrapper over touched `packages/cli` unit/E2E test files | PASS |
| 3 | Lint | `run-deno-lint.ts` over touched CLI roots, `--ext ts,tsx` | PASS |
| 4 | Format | `run-deno-fmt.ts` over touched CLI roots, `--ext ts,tsx` | PASS |
| 5 | Embedded freshness | generator `--check` / `deno task check:assets-barrel` after regeneration | PASS; no stale embedded template |
| 6 | Quality | `deno task quality:gate` | PASS |
| 7 | Doctrine | `deno task arch:check` | PASS, with F-CLI manual evidence where scripts remain pending |
| 8 | Dev behavior | Existing `behavior.app-reference` in hosted `scaffold.runtime` | `/design/composition` remains reachable in development |
| 9 | Production exclusion | New `scaffold.design-production-exclusion` in hosted `scaffold.runtime` under `ci:full` | Clean build excludes marker; planted route makes assertion fail; restored build passes |

Do not run `e2e:cli` locally without a coordinator lease.

## Open-decision sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Production intent | Resolved now | Developer-only reference/gallery; no production product contract. |
| Both RFC mechanisms | Resolved now | Deliver structural Fresh ignore plus independent fail-safe middleware. |
| Production opt-in | Safe to defer | Not required by current intent or acceptance because default output is absent. Future design must preserve independent acknowledgements. |
| Exact stable bundle marker | Resolved now | Use the existing route-only literal `Composition rules — NetScript design system` and the `(design)` source path; the mutation build first proves the selected evidence survives compilation before the clean assertion may count. Do not rely on `/design` navigation text. |
| Hosted E2E lease | Safe to defer to implementation coordinator | CI `ci:full` owns the expensive runtime execution. |

No decision that could force implementation rework remains open at the Plan-Gate.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Fresh `ignore` path matching differs across Windows/Linux separators. | Use a cross-separator regexp and test the generated config contract; hosted production build is the authoritative proof. |
| Runtime dev mode is unset, causing the fail-safe middleware to hide the gallery locally. | Keep fail-closed polarity; require the existing hosted dev reference probe to pass. If the runtime signal is absent, stop and rescope explicit dev-mode injection rather than defaulting unset to development. |
| `/design` strings remain in navigation/typed route metadata and create a false E2E failure. | Detect route-module path/marker evidence, not the URL string alone. |
| Mutation build contaminates later suite gates. | Restore config in `finally`, remove `_fresh`, and require a final clean build before returning success. Copy the cleanup discipline of `generated.quality-negative`. |
| A new E2E file deepens the recorded over-cap scaffold directory debt. | Extend the existing generated-quality gate/probe files and tests; add no top-level scaffold-gate child. |
| Template source changes without the embedded runtime copy. | Regenerate through `.llm/tools/generate-cli-assets-barrel.ts` and run the freshness check (#1657 E-1). |
| Structural and runtime exclusions accidentally share one signal. | Structural branch uses Vite config `mode`; runtime branch uses `MODE`/`NODE_ENV`; no shared bypass flag is introduced. |

## Debt and deferred scope

- Existing debt `scaffold-runtime-a8-f16-1333` remains open and is not deepened; no debt registry edit is planned.
- No CLI flag, generated README contract, documentation rewrite, package export, route-manifest API, `packages/fresh` change, or production opt-in is in scope.
- Browser visual/responsive checks are N/A: no UI appearance changes. Route behavior is covered by the existing hosted dev probe and new production build gate.

## Plan-Gate hard stop

Do not implement until a separate native opposite-family PLAN-EVAL writes `PASS` for this plan SHA. Do not merge until that Plan-Gate and the mandatory separate-session IMPL-EVAL are complete.
