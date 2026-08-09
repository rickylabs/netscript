# PR #1209 docs audit

- Audit lane: `docs_audit`, Codex GPT-5.6 Sol, medium effort (opposite-family review of Claude-authored docs)
- Worktree: `/home/codex/repos/ns005-tutorials`
- Audited baseline: `f7558aa1c..949a572e1d2b3913da7835600cbfb5b4f418b1f6`
- Audit date: 2026-08-04
- Scope: the three changed tutorials plus their predecessor/successor chapters, the package-scoped tutorial fixture, and the live `packages/fresh` / `packages/sdk` public surfaces

## Requested gate verdicts

### 1. API accuracy — FAIL

Evidence:

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/tests/type-fixtures --ext tsx` — exit 0; 1 file selected, 1 batch, 0 failed batches, 0 diagnostics. The current fixture types `dehydratedState` as exported `DehydratedState`.
- `deno doc --filter definePage packages/fresh/src/application/builders/mod.ts`, `deno doc --filter Deferred packages/fresh/src/application/defer/mod.ts`, `deno doc --filter dehydrateQueryClient packages/fresh/src/application/query/mod.ts`, `deno doc --filter hydrateFromDehydrated packages/fresh/src/application/query/mod.ts`, `deno doc --filter createNetScriptQueryClient packages/sdk/src/query-client/mod.ts`, `deno doc --filter createQueryFactories packages/sdk/src/query/mod.ts`, and `deno doc --filter createServiceQueryUtils packages/sdk/src/query-client/mod.ts` — all commands exited 0 and confirmed the named exports.
- Direct inspection of `packages/fresh/src/application/builders/define-page/**`, `packages/fresh/src/application/query/**`, `packages/fresh/src/application/defer/**`, `packages/fresh/src/runtime/ai/mod.ts`, `packages/sdk/src/query/**`, and `packages/sdk/src/query-client/**` confirmed the builder methods, query/dehydration helpers, chat exports, `Deferred`, and both SDK query-helper families used by the tutorials.
- Finding A1: `docs/site/tutorials/live-dashboard/04-definePage-QueryIsland.md:235` says the partial “streams the completed block to the browser.” The live exported `Deferred` documentation in `packages/fresh/src/application/defer/Deferred.tsx:79-84` says the current Fresh runtime is **non-streaming** and becomes fully progressive only once streaming delivery lands. The tutorial therefore presents future behavior as current behavior. The component and props exist, but the behavioral claim is false.

### 2. Narrative consistency — PASS

Evidence:

- `rg -n "auth|authenticated|session|login|sign-in|signed-in|withAuth|requireAuth" docs/site/tutorials/{chat,live-dashboard,storefront}/*.md` plus full surrounding-chapter inspection — the former page-level auth force-fit is gone. Chat authorization remains only where chapter 2 already establishes the durable session route/proxy trust boundary; no auth feature is injected into the rewritten page-builder examples.
- Read the complete changed pages and the adjacent track chapters. Chat chapter 3 uses the durable session route and `chatTurnRoute` established in chapter 2. Storefront chapter 6 uses the products service from chapter 2 and cart contract/query clients established in chapter 3. Live-dashboard chapter 4 uses the orders contract/query factory established in chapters 2–3; chapter 2 explicitly notes the scaffold's additional `update` and `getStats` procedures and chapter 3 describes per-procedure utilities including `getStats`.
- No other feature appears without a track predecessor.

### 3. Contract fidelity — PASS

Evidence:

- `rg -n "status: ctx\.search\.status|limit: ctx\.search\.limit|offset: ctx\.search\.offset" docs/site/tutorials/live-dashboard/04-definePage-QueryIsland.md` — the Step 2 `ordersData` call, dehydrated prefetch, and island props each propagate `limit`, `offset`, and `status` from the Step 1 route contract (lines 122-135 and 167-181). The stats call also propagates `status` (line 189).
- Compared against `docs/site/tutorials/live-dashboard/02-contract-to-service.md:74-89`, whose `orders.list` input is exactly `{ limit, offset, status? }`. No page-layer list query drops or invents one of those fields.

### 4. Cross-page consistency — PASS

Evidence:

- `rg -n "ordersQueryUtils = baseQueries.orders|queryOptions\(input\)|clientKey\(input|ordersQueryUtils\.update|baseQueries\.orders\.getStats" docs/site/tutorials/live-dashboard/{03-sdk-cache-first-query.md,04-definePage-QueryIsland.md}` and direct inspection of `packages/sdk/src/query/query-factory.ts` / `packages/sdk/src/ports/query-factory.ts` — chapter 3 exports `ordersQueryUtils = baseQueries.orders`; chapter 4 consistently uses raw-input `queryOptions(input)` and `clientKey(input?)`, the key shapes exposed by that same `createQueryFactories` family. It does not mix in the `{ input }` shape belonging to `createServiceQueryUtils`.
- Storefront chapter 6 consistently uses the separate `createServiceQueryUtils` API and its `{ input }` option shape introduced in the same chapter. Chat chapter 3's page seed, typed turn route, durable connection, and copied UI components agree with chapters 1–4.

### 5. Prose quality — FAIL

Evidence:

- `rg -n "seamlessly|seamless|effortlessly|powerful|robust|comprehensive|The key moves"` over the three changed tutorials found `live-dashboard/04-definePage-QueryIsland.md:302-306`.
- Finding P1: line 304 says query state passes “seamlessly,” a generic filler adverb. The three-item “The key moves” list at lines 302-306 is a feature-tour recap that repeats the immediately preceding code without explaining a new constraint; the `initialData` bullet is also imprecise because `initialData` comes from the explicit `initialOrders` prop, not “from the hydrated cache.” Replace with a short, concrete explanation of which client is hydrated and why the cache key must match, or remove the recap.
- `git diff --check f7558aa1c..HEAD` additionally reports trailing whitespace at live-dashboard chapter 4 lines 322-323.

## Gate log

| Gate | Command(s) | Scope | Result | Findings | Proceeded |
|---|---|---|---|---|---|
| `deno task docs:links` | `deno task docs:links` | Entire docs tree | PASS | 102 docs; 0 broken links; 0 broken anchors; 0 enforced orphans | Recorded |
| Site build (Lume) clean | `(cd docs/site && deno task build)` | Entire generated site at audited changeset | PASS | Exit 0; Lume completed successfully. Workspace-membership warnings were non-fatal and pre-existing configuration behavior. | Recorded |
| Internal-wording grep | Changed-line `git diff --unified=0 f7558aa1c..HEAD ... | ... | rg '#[0-9]+|PR |issue |harness|orchestrator|Claude|Codex|OpenHands|agent lane'` | Added lines in the three tutorials | PASS | No matches | Recorded |
| Versionless-specifier scan | Changed-line diff piped to `rg 'jsr:@netscript/...'` | Added lines in the three tutorials | PASS | No new bare pinnable `jsr:@netscript/*` specifiers | Recorded |
| Command/API accuracy sampling | Fixture check; seven `deno doc --filter` commands; direct source inspection | Every Fresh builders/query/defer/AI and SDK family used by the changeset | FAIL | A1: current non-streaming `Deferred` is documented as streaming a completed partial | Flagged for generator |
| Template ↔ generated drift | Applicability inspection of changed paths | No templates, generated barrels, registries, or described generated output changed | PASS (N/A) | `check:assets-barrel` not applicable | Recorded |
| Nav / front-matter wiring | `git diff --name-status f7558aa1c..HEAD`; front matter and prev/next inspection; `docs:links` | Three existing tutorial pages | PASS | No new/orphan page; existing front matter and track navigation remain wired | Recorded |
| Prose-quality pass | Full read; filler grep; `git diff --check f7558aa1c..HEAD` | Three changed tutorials | FAIL | P1 filler/feature-tour recap and imprecise `initialData` wording; trailing whitespace at lines 322-323 | Flagged for generator |
| Cross-page contradiction check | Full reads of the changed pages and surrounding chat/live-dashboard/storefront chapters; SDK key-shape/source inspection | Whole changeset and three tutorial tracks | PASS | Naming, query-helper family, route-input, and narrative predecessors align | Recorded |

## Findings requiring fixes

1. **A1 — false current streaming claim (blocking):** revise live-dashboard chapter 4 line 235 so it does not claim that the current partial streams the resolved block. Describe `Deferred` as the current Suspense-ready promise boundary, or explicitly identify progressive streaming as future behavior.
2. **P1 — filler/redundant feature-tour prose (blocking under the requested prose gate):** remove “seamlessly,” replace or delete the generic “The key moves” list, and correct the claim that `initialData` comes from the hydrated cache. Clean the two trailing spaces in the `<Deferred>` example.

## Final verdict

**FAIL_FIX**

The fixture, link gate, site build, symbol existence, route-contract propagation, narrative ordering, and cross-page naming all pass at local HEAD `949a572e1`. The changeset is not ready to polish/merge because it still makes one false runtime-behavior claim and fails the requested prose-quality bar. Return these findings to the same generator session, then re-audit the repaired changeset.

## Re-audit @ae2944908

- Re-audited local HEAD: `ae2944908a0c788cb20fe26ed33c2ee164d22d73`
- Fix commits inspected: `5b3ff38bf` (fixture quality cleanup) and `ae2944908` (A1/P1 repair)
- Scope: direct verification of findings A1 and P1, the package-scoped fixture quality lane, and affected docs build/link gates

### Finding verification

| Finding | Evidence | Result |
|---|---|---|
| A1 — false current streaming claim | Compared `docs/site/tutorials/live-dashboard/04-definePage-QueryIsland.md:234-235` with `packages/fresh/src/application/defer/Deferred.tsx:79-84`. The tutorial now states that `Deferred` is a Suspense-ready boundary in the current non-streaming Fresh runtime and becomes fully progressive only once streaming delivery lands, matching the exported component's own documentation. | FIXED / PASS |
| P1 — filler, redundant recap, incorrect `initialData` provenance, and whitespace | Inspected tutorial lines 302-307 and the repair diff `949a572e1..ae2944908`. “Seamlessly” and “The key moves” are gone. The replacement explains the exact server/client query-key matching constraint, identifies `initialData` as coming from `props.initialOrders`, and relates `clientKey(input)` to the optimistic cache target. `git diff --check f7558aa1c..HEAD` is clean; the `<Deferred>` example has no trailing whitespace. | FIXED / PASS |

### Re-run gate evidence

| Gate | Command | Result |
|---|---|---|
| Fixture type-check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/tests/type-fixtures --ext tsx` | PASS — 1 file, 1 batch, 0 failed batches, 0 diagnostics. Non-fatal existing peer-dependency warnings were emitted. |
| Fixture lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh/tests/type-fixtures --ext tsx` | PASS — 1 file, 0 findings. |
| Fixture format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh/tests/type-fixtures --ext tsx` | PASS — 1 file, 0 failed batches, 0 findings. |
| Suppression/cast scan | `rg -n "deno-(lint-ignore|fmt-ignore)|@ts-ignore|@ts-expect-error|as unknown as|as any|:[[:space:]]*any\\b|<any>" packages/fresh/tests/type-fixtures/tutorial-examples_type.tsx` | PASS — no matches. |
| Diff whitespace | `git diff --check f7558aa1c..HEAD` | PASS — no output. |
| A1/P1 wording scan | `rg -n "seamlessly|The key moves|initialData|non-streaming|fully progressive|streaming delivery|cache key|query key" docs/site/tutorials/live-dashboard/04-definePage-QueryIsland.md packages/fresh/src/application/defer/Deferred.tsx` plus line-by-line inspection | PASS — repaired claims align with source and explicit prop flow. |
| Site build | `(cd docs/site && deno task build)` | PASS — exit 0; 595 files generated. Workspace-membership warnings remain non-fatal. |
| Documentation links | `deno task docs:links` | PASS — 102 docs, 0 broken links, 0 broken anchors, 0 orphans. |

No new finding was introduced by either repair. The original PASS results for narrative consistency, contract fidelity, and cross-page consistency remain valid; the repaired text preserves those contracts.

### Re-audit final verdict

**PASS**

Both blocking findings are resolved at `ae2944908`, and every affected gate independently re-run by the auditor is green. The changeset may proceed to the separate `docs_polish` lane.
