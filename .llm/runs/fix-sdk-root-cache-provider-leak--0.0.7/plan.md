# Plan: SDK root cache-provider isolation

## Run Metadata

| Field          | Value                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| Run ID         | `fix-sdk-root-cache-provider-leak--0.0.7`                                         |
| Branch         | `fix/sdk-root-cache-provider-leak`                                                |
| Phase          | revised `plan` → mandatory `plan-eval` cycle 2 handoff                            |
| Target         | `packages/sdk` public surface plus `packages/fresh` server bootstrap consumer     |
| Archetype      | `2 — Integration`                                                                 |
| Scope overlays | none — no route/UI workflow changes; browser safety is a consumer-import contract |

## Archetype and doctrine verdict

`packages/sdk` is explicitly assigned Archetype 2 by doctrine 06. Its external axes are service
discovery/client transport and the KV-backed cache adapter behind SDK-owned ports. The current
verdict is **Keep — preserve discovery/client/cache adapter boundaries**. This fix restores that
boundary by keeping the server adapter off the root/preset graph and moving registration into the
Fresh server composition root. It does not create a new port, adapter, container, or package layer.

Applicable layering rules:

- ports remain provider-neutral and upstream-type-free;
- the KV implementation stays in the cache adapter surface;
- root and subpath entry modules are manifests, not composition sites;
- `defineFreshApp()` is the server composition root and owns explicit default wiring;
- no module-load registration survives in `packages/sdk`.

Primary axioms are A1/A2 (curated public contract without hidden magic), A8/A9 (preserve the
Archetype-2 concern split), A10/A11 (explicit composition at a named cache-provider axis), and A14
(consumer/import, JSR, docs, and generated surfaces are fitness functions).

## Goal

Publish a browser-safe `defineServices` path, make the SDK root side-effect-free and free of the
server cache adapter edge, and preserve Fresh server caching through explicit composition-root
registration. Prove the current defect red in an isolated commit before product code changes.

## Product/proof path ceiling — LOCKED

The following is the complete authorized file set after S1. A required path outside this list is a
**rescope-and-stop**: record it in `drift.md`, do not add it quietly, and return to the coordinator.
Run artifacts under this run directory are always owned evidence and are not product paths.

| Path                                                                                 | Planned change                                                                                                |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `packages/sdk/deno.json`                                                             | Add `./presets`; include its entry in package check.                                                          |
| `packages/sdk/mod.ts`                                                                | Remove the cache re-export and rewrite the root/subpath contract. Keep `defineServices` for compatibility.    |
| `packages/sdk/src/presets/mod.ts` (new)                                              | Curated, documented browser-safe preset entry; re-export the preset plus the locked ports-type closure in D4. |
| `packages/sdk/src/cache/mod.ts`                                                      | Remove import-time registration and document explicit bootstrap.                                              |
| `packages/sdk/src/cache/cache-provider.ts`                                           | Remove the now-false side-effect-import recovery guidance; retain the explicit registration example.          |
| `packages/sdk/src/cache/cache-provider_test.ts`                                      | Pin the revised provider-not-initialized guidance.                                                            |
| `packages/sdk/src/cache/kv-cache-store.ts`                                           | Correct the public JSDoc import from root to `@netscript/sdk/cache`.                                          |
| `packages/sdk/tests/query/define-services-browser-import_test.ts` (new)              | S2 intact-runtime red plus committed root/preset module-graph assertions that exclude the server KV edge.     |
| `packages/sdk/README.md`                                                             | Teach `./presets`, explicit server registration, root cache-symbol migration, and Fresh coverage.             |
| `packages/fresh/src/runtime/server/define-fresh-app.ts`                              | Import provider pieces by name and call `setCacheProvider(cacheQuery)` inside `defineFreshApp()`.             |
| `packages/fresh/src/runtime/server/define-fresh-app.test.ts`                         | Prove importing the server module is inert and invoking the bootstrap registers the provider.                 |
| `docs/site/reference/sdk/index.md`                                                   | Replace both auto-registration claims and document the focused preset entry/migration.                        |
| `docs/site/web-layer/query-bridge.md`                                                | Replace import-time registration guidance and refresh the quoted provider-not-initialized message.            |
| `docs/site/web-layer/server.md`                                                      | Replace the false re-export-side-effect claim with explicit `defineFreshApp()` registration.                  |
| `docs/site/services-sdk/sdk.md`                                                      | Replace `/cache` auto-registration guidance with explicit composition-root registration.                      |
| `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` | Regenerate only through `gen:mcp-export-corpus`; review the SDK delta.                                        |
| `.llm/assets/agent-docs/prose.json.gz`                                               | Regenerate only through `gen:agent-docs-prose` after owned site prose changes.                                |
| `.llm/assets/agent-docs/provenance.json`                                             | Regenerate only through `gen:agent-docs-prose`; review semantic provenance with the prose bundle.             |
| `packages/mcp/src/publish-assets.generated.ts`                                       | Regenerate only through `gen:publish-assets`; review the SDK prose delta.                                     |
| `packages/cli/src/kernel/assets/publish-assets.generated.ts`                         | Regenerate only through `gen:publish-assets`; review the SDK prose delta.                                     |
| `packages/cli/src/kernel/assets/agent-docs.generated.ts`                             | Mechanical generated output only: regenerate solely through `gen:assets-barrel`, never hand-edit, and require the diff to remain confined to regenerated content in this file. |

Explicitly outside the ceiling:

- `deno.lock`, dependency declarations, release baselines, issue text, and acceptance boxes;
- CLI scaffold source/tests and generated app templates (existing apps call `defineFreshApp`; a
  redundant no-op bare cache import is cleanup, not required correctness, and CLI edits would pull
  in prohibited E2E scope);
- cache/query semantics, provider/store contracts, KV implementation, Vite/browser fixtures, and
  documentation pages other than the four explicitly listed above.
- `packages/fresh/src/application/cache-entries/cache-entry.ts` and the neighbouring Fresh-root
  reachability identified by PLAN-EVAL cycle 1 F9; this is a coordinator-owned follow-up reference,
  not scope for this leaf.

## Locked decisions

| ID | Decision                                                                                                                                                                                                                                                                                                                                                            | Rationale and dominance test                                                                                                                                                                                                                                                                                                                                   |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1 | Implement all three issue moves: add `./presets`, make root/cache entry modules pure, and register explicitly in `defineFreshApp()`.                                                                                                                                                                                                                                | No single move dominates the combination. A subpath alone leaves root callers broken; root purity alone breaks servers; bootstrap alone leaves browsers broken. The additive subpath is worth its surface cost because it supplies the focused boundary the issue lacks.                                                                                       |
| D2 | Remove `export * from './src/cache/mod.ts'` from the root rather than merely removing `setCacheProvider` from the cache barrel.                                                                                                                                                                                                                                     | A pure re-export would keep `KvCacheStore` and its dynamic `@netscript/kv` edge reachable from the browser graph and would preserve the boundary contradiction documented in the root.                                                                                                                                                                         |
| D3 | Keep `defineServices` exported from the root and also export it from `./presets`.                                                                                                                                                                                                                                                                                   | Existing correct root callers get safe behavior without a source change; new/browser-shared code gets the narrow import. Removing the root preset would add an unrelated breaking change.                                                                                                                                                                      |
| D4 | `./presets` points to a new curated `src/presets/mod.ts`, not directly to `define-services.ts`; its type closure is the explicitly enumerated type surface exported by `src/ports/mod.ts` at baseline `13878a80`, excluding only `QueryClientPort`, and including `CreateServiceClientOptions`. No `export type *` or runtime value from `ports/mod.ts` is allowed. | Direct doc-lint is measured red with 10 private refs. The evaluator measured that the six direct refs cascade to 12 more; this finite ports-type enumeration closes them while excluding the pre-existing `QueryClientPort -> QueryClient` doc debt. The surface is broad but package-owned, while the runtime graph remains free of the server cache/KV edge. |
| D5 | `defineFreshApp()` calls `setCacheProvider(cacheQuery)` inside the function before app/cache-route configuration.                                                                                                                                                                                                                                                   | Registration is owned by the server composition root, is absent on module import, and is complete before invalidation handlers can resolve the provider.                                                                                                                                                                                                       |
| D6 | Do not add a registration helper.                                                                                                                                                                                                                                                                                                                                   | `setCacheProvider(cacheQuery)` is already the named public seam; a wrapper would be AP-9/AP-2 ceremony.                                                                                                                                                                                                                                                        |
| D7 | Publish README and all four affected site-page migration notes and describe the change as behavior-breaking for import-only custom servers.                                                                                                                                                                                                                         | Compile failures for root cache-symbol imports and silent behavior changes for side-effect-only imports are real compatibility consequences. `defineFreshApp` covers Fresh consumers, not custom bootstraps; leaving any published page teaching auto-registration would preserve the defect's contract.                                                       |
| D8 | Do not edit the release surface baseline to hide the diff.                                                                                                                                                                                                                                                                                                          | `surface:diff` must expose exact added/removed symbols as a measured negative for 0.0.7 review. Evidence is compared at symbol granularity.                                                                                                                                                                                                                    |

## Compatibility contract

- Preserved: `import { defineServices } from '@netscript/sdk'` remains valid and becomes inert with
  respect to cache registration.
- Added: `import { defineServices } from '@netscript/sdk/presets'` is the focused browser/shared
  entry.
- Breaking compile migration: cache engine/provider values previously imported from the root move to
  `@netscript/sdk/cache` (provider registration functions already remain on `./query`).
- Breaking behavior migration: `import '@netscript/sdk/cache'` no longer registers. Custom servers
  call `setCacheProvider(cacheQuery)` explicitly.
- Covered server path: `defineFreshApp()` performs that call for Fresh applications.
- Release communication: SDK README + all four owned site pages + generated public corpus + PR body
  must name both breaks. There is no SDK changelog file, and creating a new unpublished changelog
  convention is deferred.

## Open-decision sweep

| Decision                                           | Status                                 | Notes                                                                                                                                                                   |
| -------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add `./presets` as well as fixing root             | resolved now                           | Yes; D1/D3.                                                                                                                                                             |
| Keep cache names on root through a pure barrel     | resolved now                           | No; D2.                                                                                                                                                                 |
| Registration owner                                 | resolved now                           | Fresh `defineFreshApp`; custom server composition roots opt in.                                                                                                         |
| New helper vs existing provider seam               | resolved now                           | Use existing `setCacheProvider(cacheQuery)`.                                                                                                                            |
| Direct preset file vs curated entry                | resolved now                           | Curated entry, forced by measured doc-lint.                                                                                                                             |
| Compatibility documentation                        | resolved now                           | README/site/PR migration note required.                                                                                                                                 |
| Site-corpus derivative ownership                   | resolved now                           | Own both `.llm/assets/agent-docs/*` outputs, regenerate only through `gen:agent-docs-prose`, then regenerate publish assets.                                            |
| Lume generation availability                       | resolved now                           | This host ran `deno task check:agent-docs-prose` successfully (exit 0, 638 files built, freshness `true`); S3 must rerun after prose edits.                             |
| CLI bare import cleanup                            | safe to defer                          | It becomes redundant but generated Fresh apps are covered by `defineFreshApp`; touching CLI would expand gates/scope.                                                   |
| SDK cardinality and existing private-type-ref debt | safe to defer                          | Pre-existing measured negatives; no regression allowed.                                                                                                                 |
| Real production Vite chunk execution on this host  | safe to defer to coordinator/evaluator | Explicitly prohibited in this lane; intact-runtime import behavior and the committed static graph are necessary evidence but are not mislabeled as a real browser gate. |

No “must resolve now” decision remains.

## Design checkpoint and ordered commit slices

| #  | Slice and claim                                                                                                                                                                                                                                                                                       | Files                                                                                                  | Proving gate                                                                                                                                      |
| -- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 | Research, doctrine, alternatives, compatibility, ceiling, and gates are locked.                                                                                                                                                                                                                       | This run directory only                                                                                | PLAN-EVAL checklist in a separate session                                                                                                         |
| S2 | **RED only:** a fresh child keeps the Deno runtime intact, imports root `defineServices`, reads `hasCacheProvider()` from `src/query/mod.ts`, and requires `false`; the same committed test later inspects root/preset `deno info --json` graphs for forbidden server edges. No product file changes. | `packages/sdk/tests/query/define-services-browser-import_test.ts`; run artifacts updated in same slice | Structured focused test exits 1 with 0 passed / 1 failed at unmodified product base because the observed value is `true`; raw exit/count recorded |
| S3 | Root and focused preset graphs are pure, cache registration is explicit, Fresh preserves server behavior, compatibility prose is correct, and generated derivatives match.                                                                                                                            | Remaining authorized product/docs/generated paths                                                      | Focused test turns 1 passed / 0 failed; Fresh/provider/cache tests; check/lint/fmt; doc/JSR/publish; derivative checks                            |
| S4 | Gate reconciliation records every pass and measured negative without changing product behavior.                                                                                                                                                                                                       | Run artifacts only                                                                                     | Full selected gate table and raw `deno.lock` diff                                                                                                 |

This turn stops after S1. S2 may not begin until a separate PLAN-EVAL writes `PASS`.

## S2 red-test contract

The test must run in a fresh child process so another test module cannot pre-register or reset the
shared provider. The Deno runtime remains intact. The child dynamically imports the root,
destructures and verifies `defineServices`, imports `hasCacheProvider` directly from
`packages/sdk/src/query/mod.ts`, and asserts `false`. It does not delete or replace
`globalThis.Deno`; a `window` alias, if retained as descriptive setup, is not evidence and no
assertion may depend on it.

The same single `Deno.test` contains a later committed graph phase so the S2 base run still has
exactly one test result. Once the root runtime assertion passes after S3, it imports and verifies
`defineServices` from the new preset entry and asserts the provider remains absent. It then invokes
`deno info --json` for `packages/sdk/mod.ts` and `packages/sdk/src/presets/mod.ts`, parses their
module specifiers, and fails if either graph contains `src/cache/cache-query.ts`,
`src/cache/kv-cache-store.ts`, or `@netscript/kv`. This is the durable browser/shared safety
assertion; pure cache-provider support modules may remain reachable.

At the unchanged base the first assertion must observe `true`, producing exactly one failed test. A
module resolution failure, missing symbol, Node-compat/Deno-global crash, or any failure other than
the observed boolean mismatch is not an acceptable red. The S2 commit contains the test plus its
worklog/context evidence only—no product code.

## Fresh registration test contract

The Fresh regression must not depend on test discovery or execution order. Its registration
assertion runs in a fresh child process, imports `resetCacheProvider` and `hasCacheProvider` from
the same SDK query module instance that the workspace Fresh package resolves, calls the reset before
any Fresh server import, then dynamically imports the server entry. It asserts false immediately
after that import, invokes `defineFreshApp()` with the existing minimal test configuration, and
asserts true afterward. A static top-level import of `defineFreshApp` before reset is forbidden
because it would hide the very import-time side effect under test.

## Anti-patterns to resolve or avoid

| AP                         | Status   | Plan                                                                                                                                                                                                                                      |
| -------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AP-11 hidden globals       | existing | Remove import-driven provider mutation; registration stays explicit and test-resettable.                                                                                                                                                  |
| AP-25 non-edge side effect | existing | Make SDK root/cache/preset modules load-time pure; wire in Fresh composition root.                                                                                                                                                        |
| AP-14 upstream re-export   | risk     | Curated presets entry exports only package-owned contract types, never oRPC/TanStack modules.                                                                                                                                             |
| AP-22 useless barrel       | risk     | `src/presets/mod.ts` is the declared subpath entry; its explicit ports-type closure is wider than the preset's direct refs to satisfy JSR docs, but it exports no ports runtime values and its runtime graph has no server-cache/KV edge. |
| AP-9 premature abstraction | risk     | Reuse existing provider API; no new helper, port, or registry.                                                                                                                                                                            |
| AP-19 silent permissions   | risk     | Cache remains explicitly server-only; migration prose names the KV/server boundary.                                                                                                                                                       |

## Risk register

| Risk                                                                    | Mitigation                                                                                                                                                                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Existing root cache-symbol consumers break at compile time.             | Preserve cache symbols on `./cache`, document exact import migration, expose the surface diff honestly.                                                                        |
| Import-only server consumers silently lose caching.                     | Explicit migration note and provider error guidance; `defineFreshApp` registration test; no claim that custom servers are covered.                                             |
| New `./presets` entry worsens JSR docs.                                 | Curated dependent-type exports; targeted entry doc-lint must be clean; compare full package against the pinned negative baseline.                                              |
| Root remains connected to the server KV adapter through another export. | The committed S2 test parses both `deno info --json` graphs and rejects `cache-query.ts`, `kv-cache-store.ts`, and `@netscript/kv`.                                            |
| Fresh imports register too early.                                       | In a fresh child, import/reset the exact SDK query-provider instance first, dynamically import Fresh server, assert false, call `defineFreshApp()`, then assert true.          |
| Cache miss/hit/invalidation behavior regresses.                         | Run existing SDK query/cache suites and Fresh invalidation route tests; no cache algorithm changes allowed.                                                                    |
| Generated assets are stale or changed too broadly.                      | Record stale checks in dependency order: site prose -> agent-docs bundle -> publish assets; regenerate through named tasks only and inspect SDK-specific base-vs-head content. |
| A coarse file-level comparison hides an accidental symbol/prose change. | `surface:diff` and generated hunk review operate at export/symbol/prose granularity, following the leaf lesson.                                                                |
| Existing red doc/JSR gates are laundered as passes.                     | Pin the exact baseline outcomes below and record unchanged negatives separately from new regressions.                                                                          |

## Gate table — locked from S1

Outcomes are recorded even when negative. Structured wrappers are verdict sources for
check/test/lint/fmt; generated checks are run before and after regeneration.

| Order | Gate                             | Command/evidence                                                                                                      | Required outcome                                                                                                                                                            |
| ----- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | S2 RED                           | `.llm/tools/run-deno-test.ts -- --allow-all packages/sdk/tests/query/define-services-browser-import_test.ts`          | Before product change: exit 1, 0 pass / 1 fail; the intact-runtime child observes `hasCacheProvider() === true` where false is required. After S3: exit 0, 1 pass / 0 fail. |
| 2     | SDK/Fresh check                  | Scoped `.llm/tools/run-deno-check.ts` on the authorized SDK/Fresh TS roots with `--unstable-kv`                       | PASS after S3.                                                                                                                                                              |
| 3     | Focused tests                    | Structured test wrapper for the entry-isolation test, SDK provider/query/cache suites, and `define-fresh-app.test.ts` | PASS; committed graph assertions pass; server miss/hit/invalidation remain green.                                                                                           |
| 4     | Lint                             | Scoped `.llm/tools/run-deno-lint.ts --ext ts,tsx` on owned TS paths                                                   | PASS.                                                                                                                                                                       |
| 5     | Format                           | Scoped `.llm/tools/run-deno-fmt.ts --ext ts,tsx` on owned TS paths                                                    | PASS.                                                                                                                                                                       |
| 6     | Code quality                     | `deno task quality:scan`                                                                                              | PASS for the leaf diff; no `any`, cast escape, or new lint suppression.                                                                                                     |
| 7     | Doctrine                         | `deno task arch:check`                                                                                                | No new SDK/Fresh finding; existing debt separated.                                                                                                                          |
| 8     | Targeted preset docs             | `deno doc --lint packages/sdk/src/presets/mod.ts`                                                                     | PASS with zero diagnostics. The direct-file baseline (10 private refs) remains research evidence, not the shipped entry.                                                    |
| 9     | Full SDK doc lint                | `deno task doc:lint --root packages/sdk --pretty`                                                                     | Record result either way. Baseline is exit 1 with three unique private-type-ref source files/no missing JSDoc; no new unique diagnostic is allowed.                         |
| 10    | JSR audit                        | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/sdk --text`    | Record result either way. Baseline exit 0 has two warnings (F-DOCT-5 cardinality and slow types); no third finding. Export count becomes 13 including `./presets`.          |
| 11    | Package publish dry-run          | From `packages/sdk`: `deno publish --dry-run --allow-dirty`                                                           | Exit 0. Record any slow-type warning verbatim; do not infer clean from helper output.                                                                                       |
| 12    | Workspace publish dry-run        | `deno task publish:dry-run`                                                                                           | Record all package outcomes; SDK must pass.                                                                                                                                 |
| 13    | Export/reference drift           | `deno task docs:exports-drift`                                                                                        | PASS after S3; `./presets` must have the matching SDK reference entrypoint row.                                                                                             |
| 14    | MCP export corpus stale negative | `deno task check:mcp-export-corpus` before generation                                                                 | Expected non-zero because the published export surface moved; record exit/output. An unexpected pass is also recorded and investigated.                                     |
| 15    | MCP export corpus regenerated    | `deno task gen:mcp-export-corpus`, inspect the named SDK delta, then `deno task check:mcp-export-corpus`              | Generated output inside ceiling only; final check PASS.                                                                                                                     |
| 16    | Agent-docs prose stale negative  | `deno task check:agent-docs-prose` after owned site edits and before generation                                       | Expected non-zero because rendered site prose no longer matches the checked-in corpus; record exit/output. An unexpected pass is also recorded and investigated.            |
| 17    | Agent-docs prose regenerated     | `deno task gen:agent-docs-prose`                                                                                      | Exit 0; only the two declared `.llm/assets/agent-docs/*` outputs may change. Host capability is measured green in S1.                                                       |
| 18    | Agent-docs prose freshness       | `deno task check:agent-docs-prose`                                                                                    | PASS after generation.                                                                                                                                                      |
| 19    | CLI agent-docs assets barrel     | After the post-#1748 refresh, run `deno task gen:assets-barrel`, inspect the single authorized output, then `deno task check:assets-barrel` | PASS. The new published SDK `./presets` subpath must propagate into `EMBEDDED_AGENT_DOCS_PACKAGE_EXPORTS`, its generated hash/prose metadata may refresh, and no second generated path may change. |
| 20    | Publish-assets stale negative    | `deno task check:publish-assets` after the prose bundle is regenerated and before publish-assets generation           | Expected non-zero because the regenerated prose bundle is embedded in both publish assets; record exit/output. An unexpected pass is also recorded and investigated.        |
| 21    | Publish assets regenerated       | `deno task gen:publish-assets`, inspect both named outputs, then `deno task check:publish-assets`                     | Generated outputs inside ceiling only; final check PASS.                                                                                                                    |
| 22    | Public surface                   | `deno task surface:diff` plus exact base-vs-head export comparison                                                    | Record measured negative: new `./presets`, removed root cache symbols, unchanged `defineServices` root signature. Do not edit the release baseline.                         |
| 23    | Committed server-edge absence    | The focused test parses `deno info --json` for root and presets; review its exact forbidden-specifier diagnostics     | PASS: neither graph contains `cache-query.ts`, `kv-cache-store.ts`, or `@netscript/kv`. This is test evidence, not a review-only claim.                                     |
| 24    | Lock hygiene                     | Raw `git diff --exit-code -- deno.lock` and raw status/diff                                                           | Exit 0; `deno.lock` unchanged.                                                                                                                                              |

### Gates not run/applicable in this lane

| Gate                             | Disposition and one-line reason                                                                                                                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e:cli` / scaffold runtime     | **NOT RUN / prohibited:** no CLI/scaffold source is owned and the leaf has no runtime lease.                                                                                                                |
| Aspire/service runtime           | **N/A / prohibited:** no service resource or backend topology changes; this host cannot run it.                                                                                                             |
| Docker/container gates           | **N/A / prohibited:** no container surface changes and no lease.                                                                                                                                            |
| Real browser/Vite runtime gate   | **NOT RUN / prohibited locally:** intact-runtime import behavior and static graph evidence are not mislabeled as a production browser run; the production-chunk box remains coordinator/evaluator evidence. |
| Release/canary publication       | **N/A:** this leaf does not cut or publish a release.                                                                                                                                                       |
| Dependency latest/outdated/audit | **N/A:** no dependency specifier or graph change is authorized.                                                                                                                                             |
| Database/KV integration service  | **N/A:** registration ownership changes, not cache storage behavior; existing in-memory unit suites cover the unchanged algorithm.                                                                          |

## Debt and deferred scope

- No new debt is accepted.
- Existing SDK `src/` cardinality and private-type-ref/slow-type findings remain measured negative
  baselines and are not repaired here.
- CLI's redundant emitted bare cache import is deferred because `defineFreshApp` already owns the
  effective bootstrap and CLI edits would force prohibited E2E scope.
- PLAN-EVAL cycle 1 F9 records a neighbouring Fresh-root reachability edge through
  `packages/fresh/src/application/cache-entries/cache-entry.ts`; it is a coordinator-owned follow-up
  reference and no file from that path is authorized here.
- Real production chunk evidence cannot be generated on this host; the lane will not tick or
  self-certify issue acceptance.
- No query semantics, cache algorithms, provider types, package versions, release baselines, or
  lockfile changes.

## Drift watch and stop conditions

Stop and rescope if implementation requires any path outside the ceiling, if `defineFreshApp` does
not cover scaffolded apps, if the locked ports-type enumeration cannot make the curated entry
doc-clean, if removing the root cache edge requires query/cache algorithm changes, or if a generated
task writes any output other than its declared ceiling paths. Record the fact in `drift.md` before
returning to the coordinator.

## Plan-Gate state

PLAN-EVAL is required and not N/A. Cycle 1 returned `FAIL_PLAN` against `1bf9c567`; this revision
addresses F1-F7 and records F9 as out-of-scope follow-up evidence. No red test or product
implementation is authorized until separate PLAN-EVAL cycle 2 records `PASS`.
