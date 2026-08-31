# Plan: dynamic-route scaffold gate coverage

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-scaffold-dynamic-route-gate--1616` |
| Branch | `test/scaffold-dynamic-route-gate` |
| Phase | `plan-eval` |
| Target | `packages/cli` scaffold E2E harness |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `frontend` |

## Archetype

Archetype 6 — CLI / Tooling, with the frontend overlay. The behavior under test starts in the CLI
kernel's scaffold writer and ends in a generated Fresh application. The nested E2E workspace is the
established executable specification; this change must not create a parallel runner or bypass its
gate vocabulary.

## Current Doctrine Verdict

`packages/cli` is `Keep`. Preserve the kernel/surface split and its current composition roots. This
slice changes an explicit consumer scaffold surface and adds fitness coverage; it does not redesign
the CLI architecture or alter a published TypeScript export.

## Axioms in Play

| Axiom | Application |
| --- | --- |
| A1 | Add the route/gate contracts and RED expectations before implementation. |
| A2 | Treat the default generated route tree and references as a deliberate consumer surface. |
| A6 | Prove the package with scoped static/fitness gates and generated-consumer execution. |
| A7 | Reuse the generated-app endpoint resolver and existing gate runner. |
| A8 | Keep the route template, HTTP probe, and gate registration as single-purpose units. |
| A9 | Keep imports directed through existing CLI kernel and E2E domain/application boundaries. |
| A14 | Make the exact compile/runtime/href regression executable, not documentary. |

## Goal

Make a default scaffold contain one bound dynamic Fresh page and make the CLI runtime suite fail if
generation, compile-time path inference, runtime `ctx.path`, or bound href construction regresses.

## Scope

- Seed a useful `/examples/orders/[id]` page in every default generated app.
- Seed its initial manifest/reference, expose it through the stable app router, and link a concrete
  `/examples/orders/order-42` example from the examples page.
- Bind the page with `definePage().withRoute(...)`; render both `ctx.path.id` and the href produced
  from the bound route using the same id.
- Add a critical `behavior.app-dynamic-route` gate to `scaffold.runtime` and its sqlite catalog.
- Add semantic unit/contract coverage for emitted files, route inference, probe behavior, gate
  command construction, and suite order.

## Non-Scope

- Do not rework Fresh route generation or the already-shipped #1602 runtime fix.
- Do not inject or mutate a generated workspace from the E2E gate; provenance must be the product
  scaffold itself.
- Do not add a new suite, browser framework, dynamic-route abstraction, public package export, or
  architecture-debt entry.
- Do not edit `.github/workflows/**`; existing runtime CI wiring already executes the owner suite.
- Do not run Aspire, Docker, browser, `e2e:cli`, or `scaffold.runtime` without the serialized lease.

## Public and Generated Surfaces

| Surface | Movement |
| --- | --- |
| New-project file tree | Adds `routes/examples/orders/[id].tsx`. |
| Seeded `.generated/manifest.ts` | Adds `/examples/orders/[id]` under the examples namespace. |
| Seeded `.generated/routes.ts` | Adds its typed `createRouteReference` entry. |
| Stable `router.ts` | Exposes the generated dynamic reference without hand-authoring a second pattern. |
| Examples UI | Adds a concrete link to `order-42`; this is product-visible, not test-only. |
| Published package API | No export-map, `mod.ts`, `scaffolding.ts`, `testing.ts`, or JSDoc change. |
| E2E catalog | Adds stable gate id `behavior.app-dynamic-route`. |

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Seed the product scaffold, not an injected fixture. | This is #1616 Reading A and proves the actual default consumer artifact. |
| D2 | Use a single `[id]` route at `/examples/orders/[id]`. | One segment is the minimum real dynamic binding and keeps the example comprehensible; the historical defect was independent of parameter count. |
| D3 | Assert the path id and href with element-scoped attributes that cannot satisfy each other. | Compile success alone missed #1576, while overlapping body substrings could false-green both runtime assertions. |
| D4 | For each probe run, generate a nonce that is never the examples-page literal `order-42`; issue a plain GET to `/examples/orders/<nonce>` and a second GET to `/examples/orders/<nonce>?fresh-partial=true`. | Fresh 2 detects partial navigation through the `PARTIAL_SEARCH_PARAM` search parameter; no partial header exists. Both render modes failed before #1602 and both must remain covered. |
| D5 | Require both responses to be HTTP 200 and to contain `data-order-id="<nonce>"` on the rendered-id element plus `href="/examples/orders/<nonce>"` on the bound self-link. | The id attribute cannot be satisfied by the href attribute or vice versa. Href-only, id-only, and HTTP-500 negative cases lock the distinction. |
| D6 | Insert the new gate in this exact catalog order: `BEHAVIOR_APP_HOME` → `BEHAVIOR_APP_DYNAMIC_ROUTE` → `BEHAVIOR_APP_REFERENCE`. | It needs the real generated/built/running application and must execute before the critical browser probe, whose failure aborts all downstream gates on a host without Chromium. |
| D7 | Reuse generated-app endpoint discovery and injectable `fetch`; do not assume a port. Inherit `probe-app-home`'s zero-candidate behavior: exhausting endpoint discovery without a candidate throws and can never pass vacuously. | This preserves #952 behavior, enables deterministic lease-free probe tests, and closes the empty-selection false green. |
| D8 | No workflow commit. | Existing CI owns the runtime suite; avoiding an unnecessary workflow edit also avoids the PAT boundary. |
| D9 | Seed `routePatterns.examples.orders.$id.$route = '/examples/orders/[id]'` and `routes.examples.orders.$id.$route = createRouteReference(routePatterns.examples.orders.$id.$route, { id: 'examples.orders.$id', kind: 'page' })`; the stable alias is `generatedRoutes.examples.orders.$id.$route`. | These are the exact key path and metadata id produced by the current Fresh manifest generator for `routes/examples/orders/[id].tsx`. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Product seed versus fixture | resolved | Product seed, D1. |
| Assertion split | resolved | Compile, live path, and href round trip are distinct. |
| Suite ownership | resolved | Existing runtime suites, D6. |
| RED without lease | resolved | Contract/unit RED is available; exact live HTTP needs the lease. |
| Parameter count and example path | resolved | Single `id`, D2. |
| CI wiring | resolved | No change, D8. |
| Published API/JSR scope | resolved | No published API movement; audit N/A. |
| Marker discrimination | resolved | Non-overlapping element attributes and negative cases, D3/D5. |
| Probe input and request modes | resolved | Per-run nonce plus plain and query-param partial GETs, D4. |
| Seed/generator parity | resolved | Exact `$id.$route` key and metadata id with generator-equality test, D9. |

## File Plan

### Product scaffold

- Add `packages/cli/src/kernel/assets/app/routes/examples/orders/[id].tsx.template`.
- Register the new asset in `packages/cli/src/kernel/assets/manifest.ts`, regenerate
  `embedded.generated.ts` with `deno task gen:assets-barrel`, and expose it from
  `scaffold-template-assets.ts`.
- Extend `write-app-files.ts` to create `routes/examples/orders` and write `[id].tsx`.
- Extend `app-route-seeds.ts` with the dynamic pattern/reference.
- Extend `router.ts.template` with a stable alias to the generated reference; do not duplicate the
  pattern in another `createRouteReference` call.
- Extend `routes/examples/index.tsx.template` with the concrete example link.
- Add `routes/examples/orders/[id].tsx` to the canonical-reference vocabulary in
  `agent-conventions.ts` and to `public-command-tree_test.ts`'s retained-route list so every init
  variant proves the route survives.
- In a temp route tree containing `routes/examples/orders/[id].tsx`, call the current Fresh
  `resolveNetScriptRouteManifestOptions` / `discoverNetScriptRoutes` and render helpers. Extract the
  dynamic manifest/reference subtree from both outputs and assert exact equality with the seed,
  including `examples.orders.$id.$route`, `/examples/orders/[id]`, and metadata id
  `examples.orders.$id`; this expected value is generator-derived, not a second handwritten model.

### E2E contract

- Add `GATE.BEHAVIOR_APP_DYNAMIC_ROUTE` in `cli-surface.ts` and order it in
  `capability-suites.ts` exactly between app-home and the browser reference probe.
- Add `probe-app-dynamic-route.ts`, sharing endpoint resolution and exposing injectable I/O for
  lease-free tests. Its CLI entry accepts project root, generated app name, and AppHost path; it
  generates one nonce and probes both D4 URLs with that same nonce.
- Register its command gate in `runtime/behavior-gates.ts`, with localhost/127.0.0.1 network
  permissions, read permission, and `aspire` permission matching endpoint discovery. `commandGate`
  is already critical by default; add no redundant critical option.
- Extend writer/template tests, runtime behavior-gate tests, `suite-registry_test.ts`, and a focused
  probe test. Assertions are element/attribute-scoped, not whole generated-file or HTML snapshots.

## Ordered Slices

1. **RED — compilable semantic contract.** Add tests that compile against existing callable
   surfaces and fail only on absent/wrong behavior: `Object.values(GATE)` lacks
   `behavior.app-dynamic-route`; scaffold seed/writer/router/conventions/retained-route outputs lack
   the dynamic route/reference; catalog order lacks the new gate. Add the typed dynamic-response
   validator contract as a real module returning an explicit semantic failure result until GREEN,
   not an absent import, unconditional throw, or missing-file failure. Its table-driven test includes
   a valid plain response, a valid partial response, href-only body (must fail path), id-only body
   (must fail href), and HTTP 500 (must fail status), all using a generated nonce. Touch the existing
   writer/template/conventions/public-command-tree/runtime-registry tests and new
   `probe-app-dynamic-route.ts` / `_test.ts`. The focused structured wrapper must compile and report
   only these named semantic RED failures. Commit and push the RED alone.
2. **GREEN — scaffold surface.** Add/register/write the dynamic template, seeds, router alias, and
   examples link; extend canonical conventions and retained-route coverage; regenerate the embedded
   asset. Touch the product-scaffold files listed above and their tests. The template-text test must
   prove `[id].tsx` reads `ctx.path.id`, derives the self href from that same value through the bound
   route, and contains no `ctx.params`, `ctx.url`, or literal id fallback. A separate generator
   parity test must derive the exact D9 pattern/reference subtree from a temporary
   `routes/examples/orders/[id].tsx` and assert seed equality. The focused scaffold tests, scoped
   check, and asset-barrel gate prove this slice. Commit and push.
3. **GREEN — runtime gate.** Implement the injectable probe, register/order its command gate (which
   is critical by `commandGate` default), and make focused probe/gate/registry tests pass. Touch
   `probe-app-dynamic-route.ts`, `runtime/behavior-gates.ts`, `capability-suites.ts`, and their
   focused tests. The structured E2E unit wrapper and scoped check prove this slice. Commit and
   push.
4. **Lease-free hardening.** Run scoped check/lint/fmt, asset-barrel, quality/architecture, focused
   tests, and root tests. Touch only in-scope files if a gate finds a defect, plus run artifacts.
   All non-runtime rows in the validation table prove this slice. Commit and push.
5. **Leased merge-readiness.** After the coordinator grants the serialized lease, run the exact
   one-pass runtime suite. Touch run artifacts only unless the live gate exposes an in-scope defect.
   The exact command in validation row 10 proves generation/build/request composition and cleanup.
6. **Evaluation handoff.** Stop for separately dispatched IMPL-EVAL. Do not mark ready or merge.
   Touch run/PR handoff artifacts only; the separate evaluator verdict is the proving gate.

Every slice updates `worklog.md`; any changed fact or plan divergence is appended to `drift.md`.
Every slice boundary is committed and pushed with the prescribed explicit refspec.

## RED Feasibility

The exact live #1576 500 is not responsibly reproducible lease-free on fixed `main`: it would need a
running generated app and deliberate reintroduction of the old resolver. The independent pre-GREEN
RED is still meaningful:

- current scaffold semantic tests compile and fail because emitted outputs lack the dynamic
  asset/reference, canonical convention, and retained-route entry;
- suite tests compile and fail because `Object.values(GATE)` lacks the gate and the catalog lacks
  the required insertion between app-home and app-reference;
- the compilable response-validator contract returns a semantic failure before GREEN; its table
  distinguishes valid plain/partial responses from href-only, id-only, and HTTP-500 inputs.

The leased live gate is the final proof that those pieces compose through generation, Vite/Fresh,
partial HTTP rendering, and cleanup.

## Anti-Patterns to Avoid

| Anti-pattern | Plan |
| --- | --- |
| AP-1 / AP-9 | Keep the probe and template focused; add no convenience abstraction or barrel. |
| AP-18 | Assert generator-derived route facts and element-scoped attributes, not whole-file/HTML snapshots or overlapping substrings. |
| AP-21 | Preserve the nested Fresh route vocabulary and established E2E folders. |
| AP-25 | Keep filesystem/network/process effects at writer and gate edges; inject fetch/resolution in unit tests. |

## Fitness and Validation Gates

| Order | Gate | Command/check | Expected result |
| --- | --- | --- | --- |
| 1 | RED | Structured focused tests for seed/writer/router/conventions/retention, response validator, and runtime registry | Tests compile; only named semantic absences/rejections fail. No missing module/file/import is a RED mechanism. |
| 2 | Focused tests | `run-deno-test.ts` over owned scaffold and E2E tests | All pass after GREEN. |
| 3 | Scoped type check | `run-deno-check.ts` over changed CLI/E2E TS roots with `--unstable-kv` where workspace code requires it | Pass. |
| 4 | Scoped lint/fmt | Structured lint/fmt wrappers over changed `.ts/.tsx` roots | Pass without unrelated/generated drift. |
| 5 | Asset integrity | `deno task check:assets-barrel` | Generated embedded assets match manifest/templates. |
| 6 | Fitness | `deno task quality:gate` (includes architecture fitness) | Pass; no new/deepened debt. |
| 7 | Repository regression | `deno task test` through the structured verdict path | **Measured** at main `8a925764…`: exit 0, 4,426 passed / 0 failed / 19 ignored in 208.001s. **Measured** at branch `f22348a80…`: exit 0, 4,426 passed / 0 failed / 19 ignored in 198.633s. These counts are **carried forward** to candidate `ccd63a085`, **not freshly remeasured** — see *Gate-7 baseline carry-forward proof* below. After implementation require exit 0; if current main is red when remeasured, require no additional branch failures with exact base/branch counts. |
| 8 | Generated compile | Existing `generated.deno-check` inside runtime | The emitted Form-C page compiles with inferred `ctx.path.id: string`. |
| 9 | Live dynamic route | Existing runtime sequence, new critical behavior gate | Plain GET and `?fresh-partial=true` GET for one per-run nonce each return 200 with `data-order-id="<nonce>"` and `href="/examples/orders/<nonce>"`; zero endpoint candidates fail. |
| 10 | Merge readiness (leased) | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | `NOT_RUN` in planning; requires coordinator lease. At merge-readiness require exit 0 with generated/build/request assertions and cleanup. |

The frontend overlay's real-browser coverage remains in the same one-pass runtime suite through
`behavior.app-reference`; the new regression assertion is HTTP-semantic rather than visual. Publish
dry-run and JSR audit are N/A because no published package export or declaration surface changes.

### Gate-7 baseline carry-forward proof (supervisor-recorded, coordinator-ruled)

The gate-7 numbers above were measured at branch `f22348a80` / main `8a925764`. The evaluated
candidate is `ccd63a085`. Those counts are **carried forward, not remeasured**, on this proof:

- **Ancestry**: `git merge-base --is-ancestor f22348a80 ccd63a085` returns true. The measured head is a
  direct ancestor of the candidate; no rebase or history rewrite intervened.
- **Delta size**: `git diff --name-only f22348a80..ccd63a085` lists **28 files**.
- **Composition**: every one is documentation, a `.llm/runs/` run artifact, a `.llm/assets/` agent-doc
  asset, or a `*.generated.*` carrier — except a single file,
  `.llm/tools/docs/check-exports-drift.ts`, which received **three data-only additions** to
  `AUTHORITATIVE_MAPPING` (`plugin-ai-core` #1796, `plugin-streams-core` #1798, `mcp` #1800). No
  control flow changed in it.
- **Zero product or test movement**: that same diff filtered to `^(packages|plugins)/`, excluding
  generated carriers, returns **nothing**. No product source, no test source, no scanner, and no
  measurement code moved.
- **No per-entry test generation**: no test file references `AUTHORITATIVE_MAPPING`, so adding table
  entries cannot change the test count. `check-exports-drift_test.ts` exists but does not enumerate
  the mapping.

Therefore the 4,426 / 0 / 19 result cannot have changed across this interval. Stated plainly so the
record cannot be misread: **this is carried-forward evidence, not a fresh measurement at
`ccd63a085`.**

## JSR Audit Rubric

The required Plan-Gate rubric was applied to the planned surface. Package metadata, name,
description, exports, module/symbol documentation, slow types, ESM form, dependency specifiers, and
published file list are unchanged. The new `.tsx.template` is embedded into the existing generated
TypeScript asset barrel, matching the rubric's JSR-safe asset rule; it is not a new entrypoint or
exported declaration. Therefore `deno doc --lint` and publish dry-run are N/A for this slice, with
the existing CLI documentation debt neither deepened nor closed.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Seed and post-generation route shapes diverge | Generator-parity unit test derives the exact D9 subtree from `routes/examples/orders/[id].tsx` and asserts seed equality; `generated.deno-check` proves the regenerated consumer. |
| Gate accidentally tests a hand-authored fixture | Probe only the untouched app emitted by `scaffold.init`; no preparation/injection step. |
| Probe passes on a static/literal page | Generate a nonce distinct from `order-42`; require non-overlapping id/href attributes, and forbid `ctx.params`, `ctx.url`, and literal fallback in the template. |
| Probe guesses the app port | Reuse AppHost endpoint resolution; test command permissions. |
| Dynamic example breaks all consumers | Treat it as public scaffold scope, type-check the consumer, and prove it in the full runtime smoke. |
| Expensive resource conflict | Do not run until coordinator lease; keep cleanup enabled. |
| PAT rejects push | No workflow file is planned. If unexpected CI wiring becomes necessary, record drift and isolate it in a final unpushable commit for supervisor handling. |

## Architecture Debt

No new debt is planned. `cli/public-api-doc-completeness` remains open and unchanged because this
slice does not touch the published export surface. Any need for a duplicate route model, special
fixture mutation, or boundary violation stops the slice and is recorded before proceeding.

## Drift Watch

- Route generator output differs from the seeded namespace/alias assumed here.
- The dynamic example requires an explicit schema rather than generated reference parsing.
- Runtime catalog ownership or expensive-suite classification changes.
- A workflow edit, additional public export, or new dependency becomes necessary.
- The live probe cannot use the existing AppHost endpoint resolver cleanly.

## Plan Gate

The plan is locked. Implementation remains blocked until an independent PLAN-EVAL returns `PASS`.
This session must not dispatch or simulate that evaluator.
