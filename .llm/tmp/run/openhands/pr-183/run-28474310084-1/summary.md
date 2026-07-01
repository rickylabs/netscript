---
phase: IMPL-EVAL
verdict: APPROVED WITH FOLLOW-UPS
total: 89/100
pr: 183
head: a2e3ee05
timestamp: 2026-06-26T20:50:00Z
---

**[PHASE: IMPL-EVAL] [VERDICT: APPROVED WITH FOLLOW-UPS]**

## Scorecard (out of 100)

| # | Criterion | Score | Note |
|---|-----------|-------|------|
| 1 | v2 plan completeness | 10/10 | All 5 v1 blockers addressed: two-tree model explicit, 6 playground migrations enumerated, synthesized contract location specified, HMR vs build clarified, test paths corrected. |
| 2 | Green-per-commit 8-commit order | 8/10 | Ordering is sound in principle but lacks explicit per-commit green invariant statement. Commit 3 (generator) before commit 4 (Vite plugin) is correct dependency order, but commit 7 (migration) assumes all prior commits are green — should verify each intermediate commit compiles. |
| 3 | Type-state machine for `.withRouteContract` | 9/10 | Type-state promotion to "routed" state matches `.withRoute(...)`. The plan correctly identifies that the method accepts `{ pathSchema?, searchSchema?, paths? }` with optional `$route`, and promotes to the same routed builder state. Minor: the exact type-level implementation (conditional types in `DefinePageRouteFor`) is not sketched but is implementable based on existing `promoteRouteConfig` pattern. |
| 4 | `EmptySegment` from #179 | 10/10 | Plan correctly depends on the #179 fix. `EmptySegment = {}` is used for static segments; `Simplify<>` is used for intersection flattening. The codegen path's reliance on `createRouteReference`'s `InferRoutePatternPath` is sound. |
| 5 | Sidecar vs inline conflict resolution | 9/10 | "Inline wins, sidecar stays, build warning" severity is correct. Build warning fires at Vite build time (Rollup pass), not just dev time. Implementation detail: the warning emission mechanism (console.warn vs Vite plugin logger) is not specified but is a minor implementation choice. |
| 6 | Vite plugin page-module rewriting | 9/10 | `pageModuleRouteBinding: true | false` (default `true`) is the right option name and default. Plan correctly distinguishes dev-mode `transform()` from build-mode manifest writer. Idempotent writes prevent HMR loops via disk-based AST diff. Minor gap: the exact insertion point in the page-module AST (where `.withRoute(routes.<key>.$route)` is added relative to other builder calls) is not fully specified. |
| 7 | Test plan | 10/10 | All 3 test file paths are correct per repo layout: `builder.test.tsx` (434 lines), `manifest.test.ts` (305 lines), `vite.test.ts` (224 lines). Unit tests cover type-state promotion, AST discovery, page-module rewriting (Forms A/B/C), idempotency, conflict resolution, and option gate. This is comprehensive. |
| 8 | CLI template migration | 10/10 | All 6 files in `packages/cli/src/kernel/assets/app/routes/...` are confirmed to exist. Form A (3 files) and Form B (3 files) distribution is correct. Form A examples: `dashboard.tsx.template`, `examples/index.tsx.template`, `examples/crud.tsx.template`. Form B examples: `index.tsx.template`, `examples/telemetry/index.tsx.template`, `(design)/design/components.tsx.template`. |
| 9 | Non-goals are explicit | 10/10 | Plan correctly rules out: re-introducing page-module-export discovery, changing sidecar algorithm, auto-deleting sidecar files, removing deprecated builder APIs, changing `withRoute` signature. Non-goals are clear and well-scoped. |
| 10 | Dependencies | 9/10 | Post-#179 dependency clearly stated with rationale. The plan correctly identifies that without #179's `EmptySegment` fix, the codegen-emitted `.withRoute(routes.<key>.$route)` chain would surface `TS2322` errors for scaffolded pages with dynamic segments. Minor: the plan could more explicitly state that #179 is already merged (commit `282fea54`) and is present on `main`. |
| **Total** | | **89/100** | |

## Blocker list

No hard blockers. The v2 plan resolves all 5 blockers from the v1 plan-eval. The following are non-blocking follow-ups:

1. **Commit ordering green-invariant not explicit** — The plan lists 8 commits but does not explicitly state that each commit must leave `deno task check:packages` and `deno test` green. The implementation agent should verify this invariant at each commit. For example, commit 3 (generator: synthesize inline contract) introduces the `routeContract<N>` emission into `.generated/routes.ts` but commit 4 (Vite plugin: page-module rewriting) is what wires it into the dev/build flow. Verify that commit 3 alone does not break the type-check if the Vite plugin is not yet aware of inline contracts. **Fix**: Add a "Green-per-commit invariant" section to the planning doc stating each commit's expected green state.

2. **Form C page-module insertion point unspecified** — For Form C (no contract), the plan says "generator inserts `.withRoute(routes.<key>.$route)`" but does not specify WHERE in the builder chain this is inserted. If the page module is `definePage().withMeta(...).withHandler(...)`, does the generator insert `.withRoute(...)` after `definePage()` or before `.build()`? **Fix**: Specify the insertion point as "immediately after `definePage()` call, as the first builder method" to match the sidecar form's natural order. This lands in commit 4 (Vite plugin).

3. **Synthesized contract import path resolution** — The plan says Form A's inline contract is emitted in `.generated/routes.ts` as `routeContract<N>`, but does not fully specify how the page module imports it. The plan mentions "same `<alias>/.generated/routes.ts` import path remains the Form B/C surface" but Form A's page module needs to import `routePatterns` from `<alias>/.generated/manifest.ts` and reference the synthesized contract indirectly via the `$route:` field. The implementation agent will need to clarify whether Form A's page module imports anything from `.generated/routes.ts` (it does not — it only imports from `.generated/manifest.ts`). **Fix**: Explicitly state that Form A's page module imports `routePatterns` from `.generated/manifest.ts` and does NOT import from `.generated/routes.ts`. The synthesized contract lives in `.generated/routes.ts` but is consumed only by the generator's internal `bindRoutePattern` call. This clarification lands in commit 3.

4. **Vite plugin option propagation through Vite config** — The plan mentions `pageModuleRouteBinding` option but does not specify how it's passed from the Vite config to the generator. The current Vite plugin uses `options.routeManifest` as a nested object. Should `pageModuleRouteBinding` be a top-level option on `NetScriptVitePluginOptions` or nested under `routeManifest`? **Fix**: Specify as a top-level option on `NetScriptVitePluginOptions` for consistency with other plugin options. This lands in commit 4.

5. **Build warning emission mechanism** — The plan says "build warning" for inline+sidecar conflict but does not specify the emission mechanism (console.warn, Vite plugin logger, or error thrown). For CI visibility, the warning should be emitted at build time via the Vite plugin's `buildStart` hook or during the manifest writer pass. **Fix**: Specify "emit warning via Vite plugin's `buildStart` hook using `console.warn` or Vite's logger API" for CI visibility. This lands in commit 5 (conflict resolution).

## Implementation readiness

The v2 plan is **implementable green-per-commit** with the 5 follow-ups above addressed during implementation. The 8-commit ordering is sound:

1. Restore `.withRouteContract` builder method (foundation)
2. Manifest types extension (foundation)
3. Generator: synthesize inline contract (depends on 1, 2)
4. Vite plugin: page-module rewriting (depends on 3)
5. Generator: Form C (depends on 4)
6. Generator: conflict resolution (depends on 5)
7. Tests (depends on 6)
8. Migration: 6 CLI templates (depends on 7)

Each commit is additive and should leave the codebase compile-able. The implementation agent should verify `deno task check:packages` at each commit boundary.

## Follow-up actions (if APPROVED WITH FOLLOW-UPS)

<!-- follow-up: Add "Green-per-commit invariant" section to planning doc stating each commit's expected green state -->
<!-- follow-up: Specify Form C page-module insertion point as "immediately after definePage() call, as the first builder method" -->
<!-- follow-up: Explicitly state Form A's page module imports routePatterns from .generated/manifest.ts only, not from .generated/routes.ts -->
<!-- follow-up: Specify pageModuleRouteBinding as top-level option on NetScriptVitePluginOptions -->
<!-- follow-up: Specify build warning emission via Vite plugin's buildStart hook for CI visibility -->

## Recommendation

**Dispatch the implementation agent now.** The v2 plan resolves all 5 blockers from the v1 plan-eval and is implementable as-written. The 5 follow-ups above are non-blocking clarifications that the implementation agent can decide during execution. The 8-commit ordering is sound, the type-state design is correct, the test paths are verified, and the 6 CLI template migrations are enumerated.

The coordinator should dispatch the implementation agent with these instructions:
- Address the 5 follow-ups inline during implementation (no need to amend the planning doc).
- Verify `deno task check:packages` at each commit boundary.
- Use TypeScript's conditional types for `.withRouteContract` type-state promotion, following the existing `DefinePageRouteFor<TTypes, TRoute>` pattern.
- Use Deno's built-in TypeScript AST parsing (via `deno_graph` or regex-based scanning) for the generator's AST discovery pass.
- Emit the synthesized `routeContract<N>` in `.generated/routes.ts` in discovery order (sorted by file path).

Expected effort: 8-12 hours for a single Claude Code session. Target merge: within 48 hours of dispatch.
